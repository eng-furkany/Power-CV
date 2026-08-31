/**
 * Saf risk/gecikme mantığı — SpreadsheetApp'e bağımlı değil, kasıtlı olarak.
 * Bu, muhendislik-standartlari.md madde 9'daki "Apps Script kodu Node.js mock
 * harness ile test edilebilir" tekniğinin uygulaması: bu dosya hiçbir GAS
 * servisini çağırmadığı için tests/risk.test.js tarafından doğrudan
 * (Node vm ile) çalıştırılıp golden-value testlerine tabi tutulabiliyor.
 */

// "Q1/2026" gibi bir çeyrek string'ini {q,y} olarak ayrıştırır, aksi halde null.
function parseQuarter_(s) {
  var m = /^Q([1-4])\/(\d{4})$/.exec(String(s == null ? '' : s).trim());
  if (!m) return null;
  return { q: parseInt(m[1], 10), y: parseInt(m[2], 10) };
}

// Verilen çeyrek (q,y) "now" anına göre geçmişte mi?
function quarterIsPast_(q, y, now) {
  now = now || new Date();
  var curY = now.getFullYear();
  var curQ = Math.floor(now.getMonth() / 3) + 1;
  return (y < curY) || (y === curY && q < curQ);
}

/**
 * Bir Sheet1 kaydının risk seviyesini döner: 'ontrack' | 'gecikme' | 'risk'.
 * Kural (bkz. docs/TSD.md):
 *   1. Status "Launched" ise                              -> ontrack
 *   2. Status "Delay"/"Risk"/"On-hold" içeriyorsa           -> risk
 *   3. Launch Sheet tarihi geçmişte VE henüz Launched değilse -> risk
 *   4. Status bir çeyrek string'i ve o çeyrek geçmişteyse   -> gecikme
 *   5. Aksi halde                                           -> ontrack
 */
function computeRiskLevel_(record, now) {
  now = now || new Date();
  var status = String(record.status == null ? '' : record.status).trim();

  if (/launched/i.test(status)) return 'ontrack';
  if (/delay|risk|on.?hold/i.test(status)) return 'risk';

  var launch = record.launchSheet;
  if (launch instanceof Date && !isNaN(launch.getTime()) && launch.getTime() < now.getTime()) {
    return 'risk';
  }

  var qtr = parseQuarter_(status);
  if (qtr && quarterIsPast_(qtr.q, qtr.y, now)) return 'gecikme';

  return 'ontrack';
}

/**
 * Bir kaydın ait olduğu PLAN YILINI türetir — Sheet1'de ayrı bir "Yıl"
 * kolonu yok (bkz. docs/PRD.md), bu yüzden mevcut alanlardan çıkarsanır:
 *   1. Status "Q#/YYYY" ise -> YYYY (ör. "Q1/2027" -> 2027)
 *   2. Aksi halde Launch Sheet tarihi varsa -> o tarihin yılı (Launched
 *      kayıtlarda Status yalnız "Launched" yazar, yıl bilgisini taşımaz;
 *      gerçek launch tarihi Launch Sheet'te durur)
 *   3. İkisi de yoksa -> null ("yıl belirsiz")
 * Dashboard'daki yıl filtresi (2026/2027/...) bunu kullanır — kullanıcı
 * isteği: "bu senenin planı gelecek yılınkiyle karışmasın."
 */
function computePlanYear_(record) {
  var qtr = parseQuarter_(record.status);
  if (qtr) return qtr.y;
  var launch = record.launchSheet;
  if (launch instanceof Date && !isNaN(launch.getTime())) return launch.getFullYear();
  return null;
}

// computePlanYear_ ile aynı kaynaklardan, ama çeyrek (1-4) döner — yıl
// içindeki 4 çeyreklik OI çizgi grafiği bunu kullanır.
function computePlanQuarter_(record) {
  var qtr = parseQuarter_(record.status);
  if (qtr) return qtr.q;
  var launch = record.launchSheet;
  if (launch instanceof Date && !isNaN(launch.getTime())) return Math.floor(launch.getMonth() / 3) + 1;
  return null;
}
