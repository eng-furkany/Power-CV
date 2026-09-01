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
  // X kolonu (kullanıcı talebi): gerçekleşen OI — K kolonundaki (planlanan
  // OI) karşılığı olan gerçekleşen değer. İkisi birlikte yıllık Order Intake
  // çizgi grafiğinde Plan/Actual olarak karşılaştırılır (bkz. JavaScript.html
  // computeQuarterlyOI/drawQuarterlyChart).
  { key: 'oiActual',              col: 24, label: 'OI Actual',            editable: true,  type: 'number' },
  // Y kolonu (kullanıcı talebi): projenin genel status'u — Status
  // Planned/Actual'dan (çeyrek/milestone bazlı) farklı, sabit bir liste
  // (ör. Active/On Hold/Cancelled/Completed). Parça Listesi'nde ayrı bir
  // kolon + filtre olarak gösterilir (bkz. JavaScript.html VISIBLE_COLS/
  // FILTERABLE).
  { key: 'projectStatus',         col: 25, label: 'Project Status',      editable: true,  type: 'combo' },
  // Z kolonu (kullanıcı talebi): projeyle ilgili serbest metin yorumlar —
  // Status Planned/Actual gibi sabit bir enum değil, çok satırlı olabilir.
  // Detay Panelinde ayrı bir "Comment" bölümü (textarea) olarak, Dashboard'un
  // Risk/Gecikme tablosunda ve Parça Listesi'nde de küçük bir ikonla
  // gösterilir (bkz. JavaScript.html propRow'daki 'textarea' tipi).
  { key: 'comment',               col: 26, label: 'Comment',              editable: true,  type: 'textarea' },
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
  if (!email) throw new Error('Session could not be verified — please access with your Google account.');
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
  if (!sh) throw new Error('Sheet "' + SHEET_NAME + '" was not found.');
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

// Kullanıcı talebi (2026-09-01): tablolardaki sayılar kendi biriminin
// yanında görünsün — birimi biz uydurmuyoruz, Sheet'in 1. satırındaki
// GERÇEK başlık metnini okuyup COLUMN_MAP'in sabit `label`'ının YERİNE
// (varsa) kullanıyoruz. Kullanıcı bir kolonun başlığına "Coverage + (%)"
// gibi birim eklerse, bu otomatik olarak Parça Listesi/Detay Paneli/
// gruplu tablolarda ve KPI'larda görünür — hardcode edilmiş bir varsayım
// (ör. önceki turdaki "Coverage = yüzde" varsayımı) tekrarlanmaz.
function _columnsWithHeaders_() {
  var sh = _sheet_();
  var headerRow = sh.getRange(1, 1, 1, MAX_COL).getValues()[0];
  return COLUMN_MAP.map(function (c) {
    var h = String(headerRow[c.col - 1] == null ? '' : headerRow[c.col - 1]).trim();
    return { key: c.key, col: c.col, label: c.label, editable: c.editable, type: c.type, sheetLabel: h || c.label };
  });
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
    return { ok: true, rows: rows.map(recordToPlain_), columns: _columnsWithHeaders_(), milestoneSuggestions: MILESTONE_SUGGESTIONS };
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
    if (!found) return { error: 'Record not found: ' + pn };
    found.riskLevel = computeRiskLevel_(found);
    found.planYear = computePlanYear_(found);
    found.planQuarter = computePlanQuarter_(found);
    return { ok: true, record: recordToPlain_(found), columns: _columnsWithHeaders_(), milestoneKeys: MILESTONE_KEYS, milestoneSuggestions: MILESTONE_SUGGESTIONS };
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
    if (!col) return { error: 'Unknown field: ' + field };
    if (!col.editable) return { error: 'Field "' + col.label + '" is not editable.' };

    var sh = _sheet_();
    var last = sh.getLastRow();
    if (last < 2) return { error: 'Record not found: ' + pn };

    var pnValues = sh.getRange(2, 4, last - 1, 1).getValues(); // D kolonu
    var targetRow = -1;
    for (var i = 0; i < pnValues.length; i++) {
      if (String(pnValues[i][0]) === String(pn)) { targetRow = i + 2; break; }
    }
    if (targetRow === -1) return { error: 'Record not found: ' + pn };

    var cell = sh.getRange(targetRow, col.col);
    var oldValue = cell.getValue();

    var newValue = value;
    if (col.type === 'number') {
      newValue = (value === '' || value === null || typeof value === 'undefined') ? '' : Number(value);
      if (newValue !== '' && isNaN(newValue)) return { error: 'Please enter a numeric value.' };
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
    if (!wrote) return { error: 'Write could not be verified — please refresh the page and try again.' };

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
    var email = Session.getActiveUser().getEmail() || 'unknown';
    var sh = _logSheet_('UsageLog', ['Date', 'User', 'Page']);
    sh.appendRow([new Date(), email, page]);
  } catch (err) {
    // best-effort — loglama başarısız olursa sayfa açılışı bloklanmaz.
  }
}

function getUsageSummary() {
  _requireUser_();
  try {
    var sh = _logSheet_('UsageLog', ['Date', 'User', 'Page']);
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
  return 'Setup complete: daily risk scan scheduled for ~07:00 every day.';
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
