/**
 * Node.js mock harness — Risk.gs saf mantığını GAS'a hiç bağlanmadan test eder
 * (bkz. docs/muhendislik-standartlari.md madde 9, "VALEO OMG Dashboard" tekniği).
 * Çalıştır: node tests/risk.test.js
 */
var fs = require('fs');
var vm = require('vm');
var path = require('path');

// NOT: vm.createContext (ayrı bir V8 realm'i) KULLANILMAZ — orada üretilecek
// bir `new Date()` bu dosyanın Date'inden farklı bir yapıcıya sahip olur ve
// `instanceof Date` sessizce false döner. runInThisContext aynı global'i
// (aynı Date/RegExp) paylaşır, GAS dosyasındaki `function` bildirimleri de
// top-level olduğu için global'e eklenir.
var src = fs.readFileSync(path.join(__dirname, '..', 'Risk.gs'), 'utf8');
vm.runInThisContext(src, { filename: 'Risk.gs' });
var sandbox = global;

var failures = 0;

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    failures++;
    console.error('FAIL: ' + label + ' — expected "' + expected + '", got "' + actual + '"');
  } else {
    console.log('PASS: ' + label);
  }
}

// Sabit "bugün": 2026-08-31 -> üçüncü çeyrek (Temmuz-Eylül 2026).
var NOW = new Date('2026-08-31T00:00:00Z');

// --- computeRiskLevel_ — Status Planned (M) + Status Actual (N) ikilisi ---
// Kural: "iki kolonda da launched yazmalı" (kullanıcı talebi).
assertEqual(
  sandbox.computeRiskLevel_({ statusPlanned: 'Launched', statusActual: 'Launched' }, NOW),
  'ontrack',
  'Planned=Launched + Actual=Launched -> ontrack'
);
assertEqual(
  sandbox.computeRiskLevel_({ statusPlanned: 'Launched', statusActual: 'Q3/2026' }, NOW),
  'ontrack',
  'yalnız Planned=Launched, Actual henüz değil -> tam launched sayılmaz ama açık bir risk/gecikme sinyali de yok -> ontrack'
);
assertEqual(
  sandbox.computeRiskLevel_({ statusPlanned: 'On-hold', statusActual: '' }, NOW),
  'risk',
  'Planned=On-hold -> risk'
);
assertEqual(
  sandbox.computeRiskLevel_({ statusPlanned: 'Q3/2026', statusActual: 'Delay' }, NOW),
  'risk',
  'Actual=Delay -> risk (iki koldan da bakılır)'
);
assertEqual(
  sandbox.computeRiskLevel_({ statusPlanned: 'Q4/2026', statusActual: '' }, NOW),
  'ontrack',
  'Planned gelecek çeyrek (Q4/2026), henüz gecikme yok -> ontrack'
);
assertEqual(
  sandbox.computeRiskLevel_({ statusPlanned: 'Q1/2026', statusActual: '' }, NOW),
  'gecikme',
  'Planned geçmiş çeyrek (Q1/2026) VE Actual hâlâ Launched değil -> gecikme'
);
assertEqual(
  sandbox.computeRiskLevel_({ statusPlanned: 'Q1/2026', statusActual: 'Launched' }, NOW),
  'ontrack',
  'Planned geçmiş çeyrekte ama Actual=Launched (fiilen tamamlanmış) -> gecikme sayılmaz, ontrack'
);

// --- computePlanYear_ / computePlanQuarter_ — dashboard yıl filtresi + çeyreklik OI çizgisi ---
assertEqual(sandbox.computePlanYear_({ statusPlanned: 'Q1/2027', statusActual: '' }), 2027, 'planYear: Planned Q1/2027 -> 2027');
assertEqual(sandbox.computePlanQuarter_({ statusPlanned: 'Q1/2027', statusActual: '' }), 1, 'planQuarter: Planned Q1/2027 -> 1');
assertEqual(
  sandbox.computePlanYear_({ statusPlanned: 'Launched', statusActual: 'Q2/2026' }),
  2026,
  'planYear: Planned çeyrek değilse Actual çeyreğine düşer'
);
assertEqual(
  sandbox.computePlanYear_({ statusPlanned: 'Launched', statusActual: 'Launched', launchSheet: new Date('2026-06-01T00:00:00Z') }),
  2026,
  'planYear: ikisi de yalnız "Launched" yazıyorsa Launch Sheet tarihine düşer'
);
assertEqual(
  sandbox.computePlanQuarter_({ statusPlanned: 'Launched', statusActual: 'Launched', launchSheet: new Date('2026-06-01T00:00:00Z') }),
  2,
  'planQuarter: Haziran (ay 5, 0-index) -> Q2'
);
assertEqual(sandbox.computePlanYear_({ statusPlanned: 'TBD', statusActual: '' }), null, 'planYear: ne çeyrek ne tarih -> null');

if (failures > 0) {
  console.error('\n' + failures + ' test başarısız.');
  process.exitCode = 1;
} else {
  console.log('\nTüm testler geçti.');
}
