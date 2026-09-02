/**
 * Saf risk/gecikme mantığı — SpreadsheetApp'e bağımlı değil, kasıtlı olarak.
 * Bu, muhendislik-standartlari.md madde 9'daki "Apps Script kodu Node.js mock
 * harness ile test edilebilir" tekniğinin uygulaması: bu dosya hiçbir GAS
 * servisini çağırmadığı için tests/risk.test.js tarafından doğrudan
 * (Node vm ile) çalıştırılıp golden-value testlerine tabi tutulabiliyor.
 *
 * 2. revizyon (kullanıcı talebi): tek bir "Status" (M) kolonu yerine artık
 * iki kolon var — Status Planned (M, planlanan bitiş çeyreği) ve Status
 * Actual (N, gerçekleşen bitiş çeyreği), ikisi de "Q1/2027" gibi çeyrek
 * string'i veya "Launched" taşıyabiliyor. Eski tek-kolon `record.status`
 * artık YOK — bkz. Code.gs COLUMN_MAP (statusPlanned/statusActual).
 */

// "Q1/2026" gibi bir çeyrek string'ini {q,y} olarak ayrıştırır, aksi halde
// null. 2026-09-01 düzeltmesi (kullanıcı bulgusu: "2026'da launched
// projeler var ama Launched/Coverage KPI'ları boş görünüyor"): önceki
// regex tam olarak "Q1/2026" biçimini bekliyordu — Sheet'te "Q1 / 2026",
// "q1-2026" gibi ufak biçim farkları olursa sessizce null dönüp o satırı
// HİÇBİR yıla atayamıyordu (Total Parts/Volume/Launched/Coverage gibi
// TÜM yıl-bazlı toplamlardan tamamen düşüyordu). Artık boşluk, "/" veya
// "-" ayracı ve büyük/küçük harf farkı toleranslı.
function parseQuarter_(s) {
  var m = /^Q\s*([1-4])\s*[\/\-]\s*(\d{4})$/i.exec(String(s == null ? '' : s).trim());
  if (!m) return null;
  return { q: parseInt(m[1], 10), y: parseInt(m[2], 10) };
}

// launchSheet alanı gerçek bir Date nesnesi olarak gelebildiği gibi (Sheet
// hücresi tarih biçimliyse), metin olarak da gelebilir (hücre düz metin
// biçimliyse) — ikisini de kabul eder, aksi halde null.
function _asDate_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' && v.trim()) {
    var d = new Date(v.trim());
    if (!isNaN(d.getTime())) return d;
  }
  return null;
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
 *   1. Status Planned VE Status Actual ikisi de "Launched" ise -> ontrack
 *      (kullanıcı talebi: "iki kolonda da launched yazmalı")
 *   2. Status Planned veya Actual "Delay"/"Risk"/"On-hold" içeriyorsa -> risk
 *   3. Status Planned bir çeyrek string'i, o çeyrek geçmişte VE Actual
 *      henüz Launched değilse -> gecikme
 *   4. Aksi halde -> ontrack
 */
function computeRiskLevel_(record, now) {
  now = now || new Date();
  var planned = String(record.statusPlanned == null ? '' : record.statusPlanned).trim();
  var actual = String(record.statusActual == null ? '' : record.statusActual).trim();
  var plannedLaunched = /launched/i.test(planned);
  var actualLaunched = /launched/i.test(actual);

  if (plannedLaunched && actualLaunched) return 'ontrack';

  var flag = /delay|risk|on.?hold/i;
  if (flag.test(planned) || flag.test(actual)) return 'risk';

  var qtr = parseQuarter_(planned);
  if (qtr && quarterIsPast_(qtr.q, qtr.y, now) && !actualLaunched) return 'gecikme';

  return 'ontrack';
}

/**
 * Bir kaydın ait olduğu PLAN YILINI türetir — Sheet1'de ayrı bir "Yıl"
 * kolonu yok (bkz. docs/PRD.md), bu yüzden mevcut alanlardan çıkarsanır:
 *   1. Status Planned "Q#/YYYY" ise -> YYYY (ör. "Q1/2027" -> 2027)
 *   2. Aksi halde Status Actual "Q#/YYYY" ise -> o yıl
 *   3. Aksi halde Launch Sheet tarihi varsa -> o tarihin yılı (yedek —
 *      ikisi de yalnız "Launched" yazıyorsa yıl bilgisini taşımaz)
 *   4. Hiçbiri yoksa -> null ("yıl belirsiz")
 * Dashboard'daki yıl filtresi (2026/2027/...) bunu kullanır — kullanıcı
 * isteği: "bu senenin planı gelecek yılınkiyle karışmasın."
 */
function computePlanYear_(record) {
  var qp = parseQuarter_(record.statusPlanned);
  if (qp) return qp.y;
  var qa = parseQuarter_(record.statusActual);
  if (qa) return qa.y;
  var launch = _asDate_(record.launchSheet);
  if (launch) return launch.getFullYear();
  return null;
}

// computePlanYear_ ile aynı kaynaklardan, ama çeyrek (1-4) döner — yıl
// içindeki 4 çeyreklik OI çizgi grafiği bunu kullanır.
function computePlanQuarter_(record) {
  var qp = parseQuarter_(record.statusPlanned);
  if (qp) return qp.q;
  var qa = parseQuarter_(record.statusActual);
  if (qa) return qa.q;
  var launch = _asDate_(record.launchSheet);
  if (launch) return Math.floor(launch.getMonth() / 3) + 1;
  return null;
}
