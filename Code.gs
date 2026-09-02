/**
 * Power CV Launch Plan Dashboard — sunucu tarafı.
 * Veri kaynağı: bu script'in bağlı olduğu Google Sheet, "Sheet1" sekmesi.
 * Kolon şeması ve iş kuralları için bkz. docs/TSD.md.
 */

var SHEET_NAME = 'Sheet1';

// D kolonu = P/N = referans; kimlik alanları (plant/projectType/diameter/pn/product)
// düzenlenemez — bkz. docs/FSD.md "Detay Paneli".
var COLUMN_MAP = [
  { key: 'plant',                 col: 1,  label: 'Plant',                editable: false, type: 'text' },
  { key: 'projectType',           col: 2,  label: 'Project Type',         editable: false, type: 'text' },
  { key: 'diameter',              col: 3,  label: 'Diameter',             editable: false, type: 'number' },
  { key: 'pn',                    col: 4,  label: 'P/N',                  editable: false, type: 'text' },
  { key: 'pnCompetitor',          col: 5,  label: 'P/N Competitor',       editable: true,  type: 'text' },
  { key: 'product',               col: 6,  label: 'Product',              editable: false, type: 'text' },
  { key: 'attrPPCA',              col: 7,  label: 'Attribute (PPCA)',     editable: true,  type: 'text' },
  { key: 'attrDisc',              col: 8,  label: 'Attribute (Disc)',     editable: true,  type: 'text' },
  { key: 'attrRB',                col: 9,  label: 'Attribute (RB)',       editable: true,  type: 'text' },
  { key: 'volume',                col: 10, label: 'Volume',               editable: true,  type: 'number' },
  { key: 'oi',                    col: 11, label: 'OI',                   editable: true,  type: 'number' },
  { key: 'coveragePlus',          col: 12, label: 'Coverage +',           editable: true,  type: 'number' },
  // 2. revizyon (kullanıcı talebi): eski tek "Status" (M) ikiye ayrıldı —
  // Status Planned (M, aynı kolon, yeniden adlandırıldı) + Status Actual
  // (N, YENİ kolon). N'den itibaren her şey bir sağa kaydı (eskiden N=14
  // olan Sample Purchase şimdi O=15, ... eski AA=27 EUR şimdi AB=28).
  { key: 'statusPlanned',         col: 13, label: 'Status Planned',       editable: true,  type: 'combo' },
  { key: 'statusActual',          col: 14, label: 'Status Actual',       editable: true,  type: 'combo' },
  { key: 'msSamplePurchase',      col: 15, label: 'Sample Purchase',      editable: true,  type: 'combo' },
  { key: 'msCompetitorAnalysis',  col: 16, label: 'Competitor Analysis',  editable: true,  type: 'combo' },
  { key: 'msProductDefinition',   col: 17, label: 'Product Definition',   editable: true,  type: 'combo' },
  { key: 'msCommercialAgreement', col: 18, label: 'Commercial Agreement', editable: true,  type: 'combo' },
  { key: 'msSampleProduction',    col: 19, label: 'Sample Production',    editable: true,  type: 'combo' },
  { key: 'msBenchTesting',        col: 20, label: 'Bench testing',        editable: true,  type: 'combo' },
  { key: 'msVehicleTest',         col: 21, label: 'Vehicle Test',         editable: true,  type: 'combo' },
  { key: 'msCRD',                 col: 22, label: 'CRD',                  editable: true,  type: 'combo' },
  { key: 'launchSheet',           col: 23, label: 'Launch Sheet',         editable: true,  type: 'date' },
  { key: 'eur',                   col: 28, label: 'EUR',                  editable: true,  type: 'number' }
];

var MAX_COL = 28; // A..AB
var MILESTONE_KEYS = [
  'msSamplePurchase', 'msCompetitorAnalysis', 'msProductDefinition', 'msCommercialAgreement',
  'msSampleProduction', 'msBenchTesting', 'msVehicleTest', 'msCRD', 'launchSheet'
];
var MILESTONE_SUGGESTIONS = ['Done', 'Not Required', 'TBD', 'In Progress'];

// ---------------------------------------------------------------------------
// Sayfa sunumu
// ---------------------------------------------------------------------------

function doGet(e) {
  _logUsage_('dashboard');
  var t = HtmlService.createTemplateFromFile('Index');
  return t.evaluate()
    .setTitle('Power CV Launch Plan Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://www.google.com/images/icons/product/sheets-32.png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ---------------------------------------------------------------------------
// Yetkilendirme — muhendislik-standartlari.md madde 1: her google.script.run
// fonksiyonu, veri okuyor/yazıyorsa, gövdesinin ilk satırında bir kontrol taşır.
// Gerçek erişim sınırı deployment ayarındadır (appsscript.json "access":"DOMAIN"
// + Sheet paylaşımı); burası yalnız oturumun geçerli olduğunu doğrular.
// ---------------------------------------------------------------------------

function _requireUser_() {
  var email = Session.getActiveUser().getEmail();
  if (!email) throw new Error('Oturum doğrulanamadı — Google hesabınızla erişmelisiniz.');
  return email;
}

// ---------------------------------------------------------------------------
// Veri erişimi
// ---------------------------------------------------------------------------

function _colByKey_(key) {
  for (var i = 0; i < COLUMN_MAP.length; i++) {
    if (COLUMN_MAP[i].key === key) return COLUMN_MAP[i];
  }
  return null;
}

function _sheet_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('"' + SHEET_NAME + '" sekmesi bulunamadı.');
  return sh;
}

function _logSheet_(name, headerRow) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headerRow);
  }
  return sh;
}

function rowToRecord_(values, rowIndex) {
  var rec = { _row: rowIndex };
  COLUMN_MAP.forEach(function (c) {
    rec[c.key] = values[c.col - 1];
  });
  return rec;
}

function recordToPlain_(rec) {
  // google.script.run JSON'a serileştirirken Date otomatik ISO string'e döner;
  // yine de tutarlılık için burada da açıkça çeviriyoruz.
  var out = {};
  Object.keys(rec).forEach(function (k) {
    var v = rec[k];
    out[k] = (v instanceof Date) ? v.toISOString() : v;
  });
  return out;
}

function _readAllRows_() {
  var sh = _sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, MAX_COL).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    // A (Plant) ve D (P/N) ikisi de boşsa bu satır boş kabul edilir, atlanır.
    if (values[i][0] === '' && values[i][3] === '') continue;
    out.push(rowToRecord_(values[i], i + 2));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Parça Listesi (Dashboard da aynı uç noktayı kullanır — KPI/grafik/gruplu
// tablo agregasyonları artık istemci tarafında, getParcaListesi()'nin
// döndürdüğü satırlardan hesaplanıyor; bkz. JavaScript.html
// computeDashboardAggregates(). Bunun nedeni: üstteki genel arama kutusu
// yazıldıkça anlık olarak yeniden süzülüp/toplanabilsin — sunucuya her
// tuşta gidip gelmeden.)
// ---------------------------------------------------------------------------

function getParcaListesi() {
  _requireUser_();
  try {
    var rows = _readAllRows_();
    rows.forEach(function (r) { r.riskLevel = computeRiskLevel_(r); r.planYear = computePlanYear_(r); r.planQuarter = computePlanQuarter_(r); });
    return { ok: true, rows: rows.map(recordToPlain_), columns: COLUMN_MAP, milestoneSuggestions: MILESTONE_SUGGESTIONS };
  } catch (err) {
    return { error: String((err && err.message) || err) };
  }
}

function getParcaDetay(pn) {
  _requireUser_();
  try {
    var rows = _readAllRows_();
    var found = null;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].pn) === String(pn)) { found = rows[i]; break; }
    }
    if (!found) return { error: 'Kayıt bulunamadı: ' + pn };
    found.riskLevel = computeRiskLevel_(found);
    found.planYear = computePlanYear_(found);
    found.planQuarter = computePlanQuarter_(found);
    return { ok: true, record: recordToPlain_(found), columns: COLUMN_MAP, milestoneKeys: MILESTONE_KEYS, milestoneSuggestions: MILESTONE_SUGGESTIONS };
  } catch (err) {
    return { error: String((err && err.message) || err) };
  }
}

// ---------------------------------------------------------------------------
// Çift yönlü yazma
// ---------------------------------------------------------------------------

function updateParcaField(pn, field, value) {
  _requireUser_();
  try {
    var col = _colByKey_(field);
    if (!col) return { error: 'Bilinmeyen alan: ' + field };
    if (!col.editable) return { error: '"' + col.label + '" alanı düzenlenemez.' };

    var sh = _sheet_();
    var last = sh.getLastRow();
    if (last < 2) return { error: 'Kayıt bulunamadı: ' + pn };

    var pnValues = sh.getRange(2, 4, last - 1, 1).getValues(); // D kolonu
    var targetRow = -1;
    for (var i = 0; i < pnValues.length; i++) {
      if (String(pnValues[i][0]) === String(pn)) { targetRow = i + 2; break; }
    }
    if (targetRow === -1) return { error: 'Kayıt bulunamadı: ' + pn };

    var cell = sh.getRange(targetRow, col.col);
    var oldValue = cell.getValue();

    var newValue = value;
    if (col.type === 'number') {
      newValue = (value === '' || value === null || typeof value === 'undefined') ? '' : Number(value);
      if (newValue !== '' && isNaN(newValue)) return { error: 'Sayısal bir değer girin.' };
    } else if (col.type === 'date') {
      newValue = value ? new Date(value) : '';
    } else {
      newValue = (value === null || typeof value === 'undefined') ? '' : String(value);
    }

    cell.setValue(newValue);

    // Sağlama (muhendislik-standartlari.md madde 2): "başarılı" demeden önce
    // gerçekten yazıldığını kanıtla — geri okuyup karşılaştır.
    var verify = cell.getValue();
    var wrote;
    if (col.type === 'date') {
      wrote = (newValue === '') ? (verify === '') :
        (verify instanceof Date && newValue instanceof Date && verify.getTime() === newValue.getTime());
    } else {
      wrote = (String(verify) === String(newValue));
    }
    if (!wrote) return { error: 'Yazma doğrulanamadı — sayfayı yenileyip tekrar deneyin.' };

    return {
      ok: true,
      oldValue: (oldValue instanceof Date ? oldValue.toISOString() : oldValue),
      newValue: (newValue instanceof Date ? newValue.toISOString() : newValue)
    };
  } catch (err) {
    return { error: String((err && err.message) || err) };
  }
}

// ---------------------------------------------------------------------------
// Kullanıcı tercihleri (koyu mod / dil) — localStorage YOK, GAS kısıtı.
// bkz. Standartlar docs/koyu-mod.md.
// ---------------------------------------------------------------------------

function getUserPrefs() {
  _requireUser_();
  var props = PropertiesService.getUserProperties();
  return { darkMode: props.getProperty('darkMode'), lang: props.getProperty('lang') };
}

function saveUserPref(key, value) {
  _requireUser_();
  if (['darkMode', 'lang'].indexOf(key) === -1) return false;
  try {
    PropertiesService.getUserProperties().setProperty(key, String(value));
    return true;
  } catch (err) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Kullanım logu + özet (muhendislik-standartlari.md madde 8)
// ---------------------------------------------------------------------------

function _logUsage_(page) {
  try {
    var email = Session.getActiveUser().getEmail() || 'bilinmiyor';
    var sh = _logSheet_('UsageLog', ['Tarih', 'Kullanıcı', 'Sayfa']);
    sh.appendRow([new Date(), email, page]);
  } catch (err) {
    // best-effort — loglama başarısız olursa sayfa açılışı bloklanmaz.
  }
}

function getUsageSummary() {
  _requireUser_();
  try {
    var sh = _logSheet_('UsageLog', ['Tarih', 'Kullanıcı', 'Sayfa']);
    var last = sh.getLastRow();
    if (last < 2) return { ok: true, last7Days: 0, uniqueUsers: 0 };
    var values = sh.getRange(2, 1, last - 1, 3).getValues();
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    var count = 0;
    var users = {};
    values.forEach(function (row) {
      var d = row[0];
      if (d instanceof Date && d.getTime() >= cutoff.getTime()) {
        count++;
        if (row[1]) users[row[1]] = true;
      }
    });
    return { ok: true, last7Days: count, uniqueUsers: Object.keys(users).length };
  } catch (err) {
    return { error: String((err && err.message) || err) };
  }
}

// ---------------------------------------------------------------------------
// Otomasyon — en az bir zamanlanmış tetikleyici (muhendislik-standartlari.md madde 3)
// ---------------------------------------------------------------------------

// Kurulumdan sonra Apps Script editöründen BİR KEZ elle çalıştırılır.
function _setupApp() {
  _removeTriggers_('dailyRiskScan_');
  ScriptApp.newTrigger('dailyRiskScan_').timeBased().everyDays(1).atHour(7).create();
  return 'Kurulum tamamlandı: günlük risk taraması her gün ~07:00 için ayarlandı.';
}

function _removeTriggers_(fnName) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === fnName) ScriptApp.deleteTrigger(t);
  });
}

function dailyRiskScan_() {
  var sh = _logSheet_('Log', ['Tarih', 'Risk', 'Gecikme', 'ToplamKayit']);
  try {
    var rows = _readAllRows_();
    var riskCount = 0, gecikmeCount = 0;
    rows.forEach(function (r) {
      var level = computeRiskLevel_(r);
      if (level === 'risk') riskCount++;
      else if (level === 'gecikme') gecikmeCount++;
    });
    sh.appendRow([new Date(), riskCount, gecikmeCount, rows.length]);
  } catch (err) {
    sh.appendRow([new Date(), 'HATA', String((err && err.message) || err), '']);
  }
}

// ---------------------------------------------------------------------------
// Wishlist (Live Wishlist - Clutch CV AMEAO + Europe) — ikinci, salt-okunur
// bir dashboard sayfası. Bu script'in bağlı olduğu Sheet1'den TAMAMEN FARKLI
// bir Google Sheet'ten okur (kendi ID'si aşağıda) — kullanıcının ayrıca
// paylaştığı bir "wishlist"/proje-boru-hattı tablosu. Detay: docs/TSD.md
// "Wishlist" bölümü.
//
// Bu Apps Script projesinin çalıştığı kimlik (appsscript.json:
// executeAs=USER_ACCESSING) bu sheet'e erişebilmeli — yani her kullanıcı
// kendi Google hesabıyla WISHLIST_SPREADSHEET_ID'ye en az görüntüleyici
// olarak paylaşılmış olmalı. Paylaşımı yoksa openById() hata fırlatır, bu da
// aşağıda yakalanıp { error } olarak döner — istemci bunu "şu an alınamıyor +
// Tekrar dene" olarak gösterir (grafikler.md "yüklenemeyen veri ≠ boş veri").
// ---------------------------------------------------------------------------

var WISHLIST_SPREADSHEET_ID = '1KB_-wTAFxPsaxMmMC2YODLPyB7JL0NsPgLvsiBoWFQQ';
var WISHLIST_SHEET_NAME = 'LIVE WISHLIST CV';

// Kaynak sheet'in gerçek yapısı: başlık B/C/vb. hücrelere gömülü satır
// sonlarıyla (Alt+Enter) yazılmış TEK bir başlık satırı (4. satır), veri
// 5. satırdan başlıyor — CSV dışa aktarımında bu \n'ler yüzünden birden çok
// satırmış gibi görünüyordu, gerçek yapı bu.
var WISHLIST_HEADER_ROW = 4;
var WISHLIST_DATA_START_ROW = 5;
var WISHLIST_MAX_COL = 95; // A..CQ, 95 sütun

// Sütun SIRASINA göre değil, kaynak sheet'in 95 sütununu tek tek inceleyerek
// (2026-09 analizi) belirlenen SABİT kolon numaralarına göre okunur — bu
// script'in Sheet1 COLUMN_MAP'iyle aynı desen. Bazı başlık metinleri
// (EUROPE/TMEAO/Americas) sheet'te BİRDEN FAZLA farklı bölümde tekrarlandığı
// için (CarPark / VS Potential / Specific Target Prices) yalnız başlık
// metnine bakarak eşlemek güvenli değil — bu yüzden sabit indeks tercih
// edildi. Kaynak sheet'in sütunları yeniden düzenlenirse bu harita elle
// güncellenmeli; _wishlistVerifyHeader_ bunu sessizce yanlış okumak yerine
// açık bir hatayla yakalamaya çalışır (madde 2, sağlama).
var WISHLIST_COLUMN_MAP = [
  { key: 'flag',                col: 1 },
  { key: 'wlYear',               col: 2 },
  { key: 'category',             col: 3 },
  { key: 'productRange',         col: 6 },
  { key: 'dia',                   col: 7 },
  { key: 'vsRegion',              col: 8 },
  { key: 'projectCode',           col: 11 },
  { key: 'vsPartNumber',          col: 12 },
  { key: 'prio',                   col: 13 },
  { key: 'notes',                  col: 14 },
  { key: 'manufacturer',           col: 17 },
  { key: 'model',                  col: 18 },
  { key: 'competitorBrand',        col: 24 },
  { key: 'competitorProduct',      col: 25 },
  { key: 'totalVsPotential',       col: 37 },
  { key: 'yearlyPotentialAvg5y',   col: 60 },
  { key: 'priceEurope',            col: 73 },
  { key: 'priceTmeao',             col: 74 },
  { key: 'priceAmericas',          col: 75 },
  { key: 'carPark',                col: 82 },
  { key: 'site',                   col: 85 },
  { key: 'launchPlan',             col: 86 },
  { key: 'plannedMonth',           col: 87 },
  { key: 'projectStatusRaw',       col: 88 },
  { key: 'orderIntake',            col: 89 },
  { key: 'action',                 col: 92 },
  { key: 'reasonCancelled',        col: 93 },
  { key: 'samplesAvailability',    col: 94 },
  { key: 'technology',             col: 95 }
];

function _wishlistSheet_() {
  var ss = SpreadsheetApp.openById(WISHLIST_SPREADSHEET_ID);
  var sh = ss.getSheetByName(WISHLIST_SHEET_NAME);
  if (!sh) throw new Error('"' + WISHLIST_SHEET_NAME + '" sekmesi bulunamadı — sekme adı değişmiş olabilir.');
  return sh;
}

function _normHeaderCell_(v) {
  return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

// Sağlama (madde 2): tüm 95 sütunu tek tek doğrulamak yerine, birkaç
// belirgin/az değişecek başlığı sabit konumunda kontrol eder — sheet'in
// üçüncü bir kişi tarafından yeniden düzenlenmesi durumunda WISHLIST_COLUMN_MAP
// ile gerçek veri arasındaki uyumsuzluğu SESSİZCE yanlış okumak yerine açık
// bir hatayla yakalar.
function _wishlistVerifyHeader_(sh) {
  var checks = [
    { col: 2, expect: 'wl year' },
    { col: 8, expect: 'vs region' },
    { col: 88, expect: 'project status' }
  ];
  for (var i = 0; i < checks.length; i++) {
    var actual = _normHeaderCell_(sh.getRange(WISHLIST_HEADER_ROW, checks[i].col).getValue());
    if (actual.indexOf(checks[i].expect) === -1) {
      throw new Error(
        'Wishlist sheet yapısı beklenenden farklı görünüyor (satır ' + WISHLIST_HEADER_ROW + ', kolon ' +
        checks[i].col + ' başlığı "' + checks[i].expect + '" içermiyor — okunan: "' + actual + '"). ' +
        'Sütunlar taşınmış/eklenmiş olabilir; Code.gs WISHLIST_COLUMN_MAP elle güncellenmeli.'
      );
    }
  }
}

function _wishlistRowToRecord_(values, rowIndex) {
  var rec = { _row: rowIndex };
  WISHLIST_COLUMN_MAP.forEach(function (c) {
    var v = values[c.col - 1];
    rec[c.key] = (v instanceof Date) ? v.toISOString() : v;
  });
  return rec;
}

function _readWishlistRows_() {
  var sh = _wishlistSheet_();
  _wishlistVerifyHeader_(sh);
  var last = sh.getLastRow();
  if (last < WISHLIST_DATA_START_ROW) return [];
  var numRows = last - WISHLIST_DATA_START_ROW + 1;
  var values = sh.getRange(WISHLIST_DATA_START_ROW, 1, numRows, WISHLIST_MAX_COL).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    // WL YEAR (B) ve Project Category (C) ikisi de boşsa satır boş kabul edilir.
    if (String(values[i][1]).trim() === '' && String(values[i][2]).trim() === '') continue;
    out.push(_wishlistRowToRecord_(values[i], WISHLIST_DATA_START_ROW + i));
  }
  return out;
}

function getWishlistData() {
  _requireUser_();
  try {
    var rows = _readWishlistRows_();
    var now = new Date();
    rows.forEach(function (r) {
      // Ham projectStatusRaw'a hiç dokunulmaz (StatusLex ilkesi) — yalnız
      // KPI/grafik kategorizasyonu için türetilmiş bir alan eklenir.
      r.statusBucket = wishlistStatusBucket_(r.projectStatusRaw);
      r.attention = wishlistAttention_(r, now);
      r.priceEuropeNum = parseWishlistPrice_(r.priceEurope);
      r.priceTmeaoNum = parseWishlistPrice_(r.priceTmeao);
      r.priceAmericasNum = parseWishlistPrice_(r.priceAmericas);
    });
    return {
      ok: true,
      rows: rows,
      updatedAt: now.toISOString(),
      sourceUrl: 'https://docs.google.com/spreadsheets/d/' + WISHLIST_SPREADSHEET_ID + '/edit#gid=0'
    };
  } catch (err) {
    return { error: String((err && err.message) || err) };
  }
}
