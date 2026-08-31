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

assertEqual(sandbox.computeRiskLevel_({ status: 'Launched' }, NOW), 'ontrack', 'Launched -> ontrack');
assertEqual(sandbox.computeRiskLevel_({ status: 'On-hold' }, NOW), 'risk', 'On-hold -> risk');
assertEqual(sandbox.computeRiskLevel_({ status: 'Delay' }, NOW), 'risk', 'Delay -> risk');
assertEqual(sandbox.computeRiskLevel_({ status: 'Q4/2026' }, NOW), 'ontrack', 'gelecek çeyrek (Q4/2026) -> ontrack');
assertEqual(sandbox.computeRiskLevel_({ status: 'Q1/2026' }, NOW), 'gecikme', 'geçmiş çeyrek (Q1/2026) -> gecikme');
assertEqual(
  sandbox.computeRiskLevel_({ status: 'Q3/2026', launchSheet: new Date('2026-01-01T00:00:00Z') }, NOW),
  'risk',
  'geçmiş Launch Sheet tarihi + henüz Launched değil -> risk'
);

if (failures > 0) {
  console.error('\n' + failures + ' test başarısız.');
  process.exitCode = 1;
} else {
  console.log('\nTüm testler geçti.');
}
