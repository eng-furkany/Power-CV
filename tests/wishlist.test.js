/**
 * Node.js mock harness — Wishlist.gs saf mantığını GAS'a hiç bağlanmadan test
 * eder (bkz. docs/muhendislik-standartlari.md madde 9, "VALEO OMG Dashboard"
 * tekniği — aynı desen tests/risk.test.js'te).
 * Çalıştır: node tests/wishlist.test.js
 */
var fs = require('fs');
var vm = require('vm');
var path = require('path');

var src = fs.readFileSync(path.join(__dirname, '..', 'Wishlist.gs'), 'utf8');
vm.runInThisContext(src, { filename: 'Wishlist.gs' });
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

// --- wishlistStatusBucket_ — gerçek sheet'te görülen varyantlar ---
assertEqual(sandbox.wishlistStatusBucket_(''), 'Unspecified', 'boş -> Unspecified');
assertEqual(sandbox.wishlistStatusBucket_('   '), 'Unspecified', 'yalnız boşluk -> Unspecified');
assertEqual(sandbox.wishlistStatusBucket_('Launched'), 'Launched', 'Launched -> Launched');
assertEqual(sandbox.wishlistStatusBucket_('Launched MT 10/2024, AMT EXT 03/2025'), 'Launched', 'karma launched cümlesi -> Launched');
assertEqual(sandbox.wishlistStatusBucket_('in OE production'), 'Launched', '"in OE production" -> Launched (case-insensitive)');
assertEqual(sandbox.wishlistStatusBucket_('CA pending'), 'CA', 'CA pending -> CA');
assertEqual(sandbox.wishlistStatusBucket_('CA Signed'), 'CA', 'CA Signed -> CA');
assertEqual(sandbox.wishlistStatusBucket_('CA signed'), 'CA', 'CA signed (küçük s) -> CA');
assertEqual(sandbox.wishlistStatusBucket_('Feasibility study.'), 'InDevelopment', 'Feasibility study. -> InDevelopment');
assertEqual(sandbox.wishlistStatusBucket_('Investigation'), 'InDevelopment', 'Investigation -> InDevelopment');
assertEqual(sandbox.wishlistStatusBucket_('In development in Chennai'), 'InDevelopment', 'In development in Chennai -> InDevelopment');
assertEqual(sandbox.wishlistStatusBucket_('Sample procurement'), 'InDevelopment', 'Sample procurement -> InDevelopment');
assertEqual(sandbox.wishlistStatusBucket_('Cancelled per VS request.'), 'CancelledOrNotAllocated', 'Cancelled per VS request. -> CancelledOrNotAllocated');
assertEqual(sandbox.wishlistStatusBucket_('CANCELLED REVIEW OR RE-ALLOCATE'), 'CancelledOrNotAllocated', 'tüm-büyük CANCELLED -> CancelledOrNotAllocated');
assertEqual(sandbox.wishlistStatusBucket_('Not allocated'), 'CancelledOrNotAllocated', 'Not allocated -> CancelledOrNotAllocated');
assertEqual(
  sandbox.wishlistStatusBucket_('Not allocated  (Ruen & Macas solutions failed), TMEAO can follow VS Europe trading solution with Tibbets in China'),
  'CancelledOrNotAllocated',
  'uzun serbest metin içinde "Not allocated" -> CancelledOrNotAllocated'
);
assertEqual(sandbox.wishlistStatusBucket_('Pending new PRS calculation'), 'Other', 'bilinmeyen bir varyant -> Other');

// --- parseWishlistPrice_ — gerçek sheet'te görülen format çeşitliliği ---
assertEqual(sandbox.parseWishlistPrice_('275,00 €'), 275, 'TR virgül ondalık -> 275');
assertEqual(sandbox.parseWishlistPrice_('380.00 €'), 380, 'nokta ondalık (boşluklu) -> 380');
assertEqual(sandbox.parseWishlistPrice_('418.70€'), 418.7, 'nokta ondalık (boşluksuz) -> 418.7');
assertEqual(sandbox.parseWishlistPrice_('R$ 991,82'), 991.82, 'Brezilya Reali, virgül ondalık -> 991.82');
assertEqual(sandbox.parseWishlistPrice_('82 500,00 €'), 82500, 'boşluklu binlik + virgül ondalık -> 82500');
assertEqual(sandbox.parseWishlistPrice_('1 252 500,00 €'), 1252500, 'çift boşluklu binlik -> 1252500');
assertEqual(sandbox.parseWishlistPrice_('?'), null, '"?" -> null (bilinmiyor)');
assertEqual(sandbox.parseWishlistPrice_('TBD'), null, '"TBD" -> null');
assertEqual(sandbox.parseWishlistPrice_('-'), null, '"-" -> null (yok)');
assertEqual(sandbox.parseWishlistPrice_(''), null, 'boş -> null');
assertEqual(sandbox.parseWishlistPrice_(null), null, 'null -> null');

// --- wishlistAttention_ — Launch Plan çeyreği geçmiş + hâlâ Launched değil ---
var NOW = new Date('2026-09-02T00:00:00Z'); // 3. çeyrek (Temmuz-Eylül 2026)
assertEqual(
  sandbox.wishlistAttention_({ projectStatusRaw: 'CA pending', launchPlan: 'Q1/2025' }, NOW),
  true,
  'geçmiş çeyrek (Q1/2025) + Launched değil -> dikkat'
);
assertEqual(
  sandbox.wishlistAttention_({ projectStatusRaw: 'CA pending', launchPlan: 'Q1 2025' }, NOW),
  true,
  'boşluklu çeyrek biçimi (Q1 2025) da tanınır -> dikkat'
);
assertEqual(
  sandbox.wishlistAttention_({ projectStatusRaw: 'Launched', launchPlan: 'Q1/2025' }, NOW),
  false,
  'çeyrek geçmiş ama statü zaten Launched -> dikkat yok'
);
assertEqual(
  sandbox.wishlistAttention_({ projectStatusRaw: 'CA pending', launchPlan: 'Q4/2026' }, NOW),
  false,
  'gelecek çeyrek (Q4/2026) -> henüz dikkat yok'
);
assertEqual(
  sandbox.wishlistAttention_({ projectStatusRaw: 'CA pending', launchPlan: 'TBD' }, NOW),
  false,
  'Launch Plan çeyrek biçiminde değil (TBD) -> ayrıştırılamaz, dikkat işaretlenmez'
);

if (failures > 0) {
  console.error('\n' + failures + ' test başarısız.');
  process.exitCode = 1;
} else {
  console.log('\nTüm testler geçti.');
}
