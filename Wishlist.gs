/**
 * Live Wishlist (Clutch CV AMEAO + Europe) — saf mantık.
 * Risk.gs'teki desenin aynısı: SpreadsheetApp'e hiç bağımlı değil, bu yüzden
 * tests/wishlist.test.js tarafından Node vm ile doğrudan çalıştırılıp
 * golden-value testlerine tabi tutulabiliyor (muhendislik-standartlari.md
 * madde 9, "VALEO OMG Dashboard" tekniği).
 *
 * Veri kaynağı Sheet1'den (bu script'in bağlı olduğu tablo) FARKLI, ayrı bir
 * Google Sheet — bkz. Code.gs "Wishlist" bölümü + docs/TSD.md.
 */

// --------------------------------------------------------------------------
// PROJECT STATUS — serbest metin, küçük bir kategori setine eşlenir. Ham
// değere hiçbir yerde dokunulmaz (StatusLex ilkesi, dil-yerellestirme.md) —
// bu yalnız KPI/grafik kategorizasyonu için, detay panelinde ham metin de
// ayrıca gösterilir.
// --------------------------------------------------------------------------

function wishlistStatusBucket_(raw) {
  var s = String(raw == null ? '' : raw).trim();
  if (!s) return 'Unspecified';
  var low = s.toLowerCase();
  if (low.indexOf('launch') > -1 || low.indexOf('in oe production') > -1) return 'Launched';
  if (low.indexOf('ca pending') > -1 || low.indexOf('ca signed') > -1 || low.indexOf('ca in progress') > -1) return 'CA';
  if (low.indexOf('feasibility') > -1 || low.indexOf('investigation') > -1 || low.indexOf('product definition') > -1 ||
      low.indexOf('in development') > -1 || low.indexOf('sample procurement') > -1 || low.indexOf('competitor analysis') > -1) {
    return 'InDevelopment';
  }
  if (low.indexOf('cancel') > -1 || low.indexOf('not allocated') > -1) return 'CancelledOrNotAllocated';
  return 'Other';
}

// --------------------------------------------------------------------------
// Fiyat/para alanları — kaynak sheet'te format tutarsız: "275,00 €" (TR
// ondalık virgülü), "R$ 991,82" (Brezilya Reali, yine virgül ondalık),
// "380.00 €" / "418.70€" (nokta ondalık), "?" / "TBD" / "-" / boş (yok
// sayılır). Rakam olmayan her şey atılır, kalan virgül/nokta karışımından
// hangisinin ondalık ayracı olduğu SONUNCU geçen işarete bakılarak kararır.
// --------------------------------------------------------------------------

function parseWishlistPrice_(raw) {
  var s = String(raw == null ? '' : raw).trim();
  if (!s || s === '-' || s === '?' || /^tbd$/i.test(s)) return null;
  var cleaned = s.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;
  var lastComma = cleaned.lastIndexOf(','), lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    // Virgül ondalık ayracı — olası binlik nokta ayraçları atılır.
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > -1) {
    // Nokta ondalık ayracı — olası binlik virgül ayraçları atılır.
    cleaned = cleaned.replace(/,/g, '');
  }
  var n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// --------------------------------------------------------------------------
// Dikkat rozeti — muhendislik-standartlari.md madde 7 ("en az bir eşik-tabanlı
// dikkat katmanı"). Launch Plan alanı Risk.gs'teki Status Planned ile aynı
// "Q#/YYYY" biçimini taşıyabiliyor (bazen boşlukla: "Q1 2024") — o çeyrek
// geçmişte VE proje hâlâ Launched değilse dikkat rozeti yakılır.
// --------------------------------------------------------------------------

function parseWishlistQuarter_(s) {
  var m = /^Q([1-4])[\/\s](\d{4})$/.exec(String(s == null ? '' : s).trim());
  if (!m) return null;
  return { q: parseInt(m[1], 10), y: parseInt(m[2], 10) };
}

function wishlistQuarterIsPast_(q, y, now) {
  now = now || new Date();
  var curY = now.getFullYear();
  var curQ = Math.floor(now.getMonth() / 3) + 1;
  return (y < curY) || (y === curY && q < curQ);
}

function wishlistAttention_(record, now) {
  var bucket = wishlistStatusBucket_(record.projectStatusRaw);
  if (bucket === 'Launched') return false;
  var qtr = parseWishlistQuarter_(record.launchPlan);
  if (qtr && wishlistQuarterIsPast_(qtr.q, qtr.y, now)) return true;
  return false;
}
