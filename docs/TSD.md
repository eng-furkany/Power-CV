# TSD — Teknik Tasarım

## Mimari

Tek bir Google Apps Script (GAS) container-bound web app. `HtmlService` ile sunulan çok
dosyalı (Index/Stylesheet/JavaScript) bir istemci, `google.script.run` ile `Code.gs`'teki
sunucu fonksiyonlarını çağırır. Sheets doğrudan veri katmanı — ayrı bir veritabanı yok.

```
Kullanıcı ↔ HtmlService (Index/Stylesheet/JavaScript.html)
                 │  google.script.run (JSON, success/failure)
                 ▼
            Code.gs  ──►  SpreadsheetApp (Sheet1, UsageLog, opsiyonel Prefs)
                 │
                 ▼
       ScriptApp trigger (günlük) → risk taraması + özet
```

## Veri Modeli — `Sheet1`

| Kolon | Alan | Tip | Not |
|---|---|---|---|
| A | Plant | metin | |
| B | Project Type | metin | |
| C | Diameter | sayı | |
| D | **P/N** | metin/sayı | **Referans — tıklanınca Detay Paneli açılır** |
| E | P/N Competitor | metin | `-` = yok |
| F | Product | metin | PPCA / Disc / RB / K2P / K3P / Twin / GC / DBE / W3C ... |
| G | Attribute (PPCA) | metin | yalnız Product=PPCA'da anlamlı, aksi halde `-` |
| H | Attribute (Disc) | metin | yalnız Product=Disc'te anlamlı |
| I | Attribute (RB) | metin | yalnız Product=RB'de anlamlı |
| J | Volume | sayı | |
| K | OI | sayı | |
| L | Coverage + | sayı | |
| M | **Status Planned** | metin | Planlanan bitiş çeyreği (`Q4/2026` gibi) veya `Launched` veya `Delay`/`Risk`/`On-hold` — **2. revizyon**: eskiden tek "Status" kolonuydu |
| N | **Status Actual** | metin | Gerçekleşen bitiş çeyreği veya `Launched` — **YENİ kolon** (2. revizyon), M ile aynı format |
| O–W | 9 kilometre taşı | metin/tarih | Sample Purchase, Competitor Analysis, Product Definition, Commercial Agreement, Sample Production, Bench testing, Vehicle Test, CRD, Launch Sheet — değerler `Done`/`Not Required`/`TBD`/çeyrek string; **W (Launch Sheet) bir tarih**. N eklenince bir sağa kaydı (eskiden N–V idi). |
| AB | EUR | sayı | N eklenince AA'dan kaydı |

**2026-09 revizyonu — M/N kolonları:** Kullanıcı gerçek Sheet'inde tek "Status" (M) kolonunu
ikiye ayırdı: **Status Planned** (M, aynı kolon yeniden adlandırıldı) ve **Status Actual**
(N, yeni eklendi) — "planlanan bitiş" ile "gerçekte olan bitiş" ayrı ayrı takip edilsin diye.
İkisi de aynı format (`Q#/YYYY` çeyrek string'i veya `Launched`/`Delay`/`Risk`/`On-hold`).
**Bir proje yalnız İKİ kolonda da `Launched` yazıyorsa tam tamamlanmış sayılır** (kullanıcı
kararı) — yalnız Planned'ın `Launched` olması yetmez. N'nin eklenmesiyle ondan sonraki tüm
kolonlar (eski N–V, eski AA) bir sağa kaydı; `Code.gs` `COLUMN_MAP` buna göre güncellendi.

**Bilinmeyen/Varsayılan Alanlar:** G/H/I kolonlarının iş kuralı örnek veride belirsizdi (yalnız
üç ürün tipine özel görünüyor). Bu tur bunları salt görüntüleme/düzenleme alanı olarak ele
alıyor, aralarında bir hesaplama/koşul kurmuyor — gerçek Sheet'te farklı bir anlam taşıdığı
görülürse `Code.gs`'teki `COLUMN_MAP` tek noktadan güncellenir.

## API — `google.script.run` Yüzeyi

Her fonksiyon `muhendislik-standartlari.md` madde 1 gereği `_requireUser_()` ile başlar
(oturum açmış geçerli bir Google hesabı zorunlu — tek rol olduğu için ek bir rol kontrolü
yok, ama boş/anonim çağrı reddedilir).

| Fonksiyon | Yön | Açıklama |
|---|---|---|
| `getParcaListesi()` | oku | `Sheet1`'in tamamı, normalize edilmiş satır nesneleri + `riskLevel` |
| `getParcaDetay(pn)` | oku | Tek kaydın tüm alanları |
| `updateParcaField(pn, field, value)` | **yaz** | Tek hücre güncelleme — whitelist edilmiş `field` adları, sunucu tarafı doğrulama, sağlama (madde 2) |
| `getUserPrefs()` / `saveUserPref(key, value)` | oku/yaz | Koyu mod + dil tercihi, `PropertiesService.getUserProperties()` |
| `getUsageSummary()` | oku | Haftalık görüntülenme özeti (madde 8) |

Her yazma çağrısı gerçek sonucu (`{ok:true}` / `{error:'...'}`) döner; istemci
`veri-listeleme.md`'deki sözleşmeye göre HER ZAMAN denetler.

**Dashboard'un KPI/pasta-grafik/gruplu-tablo agregasyonları artık ayrı bir uç noktası
yok** — Dashboard da `getParcaListesi()`'nin döndürdüğü aynı satır önbelleğini kullanır,
`JavaScript.html`'deki `computeDashboardAggregates()` istemci tarafında hesaplar. Bunun
nedeni: sayfanın üstündeki genel arama kutusu (virgülle ayrılmış çoklu terim, OR eşleşme)
her tuş vuruşunda tüm KPI/grafik/tabloları anlık yeniden hesaplaması gerekiyor — sunucuya
her karakterde gidip gelmek bunu yavaşlatırdı. `Sheet1` satır sayısı (≲1000) bu hesaplamayı
tarayıcıda yapmak için zaten küçük ölçekte.

## Risk Rozeti — Eşik Kuralı (`muhendislik-standartlari.md` madde 7)

```
computeRiskLevel_(row):
  Status Planned == 'Launched' VE Status Actual == 'Launched'     → 'ontrack'
  Status Planned veya Actual /delay|risk|on.?hold/i                → 'risk'   (yüksek)
  Status Planned bir çeyrek (Q#/YYYY), o çeyrek geçmişte
    VE Status Actual hâlâ 'Launched' değil                        → 'gecikme' (uyarı)
  aksi hâlde                                                       → 'ontrack'
```

Bu, AI/istatistik gerektirmeyen, ucuz bir "dikkat rozeti" katmanı — dashboard'daki risk
tablosu ve KPI'daki "Risk/Gecikme" sayacı bu fonksiyonu kullanır.

## Plan Yılı/Çeyreği — Türetilmiş Alan (kolon değil)

Sheet1'de gerçek bir "Yıl" kolonu yok; kullanıcı talebiyle (bu yılın planının gelecek
yılınkiyle karışmaması) eklenmedi, bunun yerine `Risk.gs`'teki `computePlanYear_`/
`computePlanQuarter_` mevcut alanlardan türetiyor — aynı `parseQuarter_` yardımcısını
`computeRiskLevel_` ile paylaşıyor:

```
computePlanYear_(row):
  Status Planned "Q#/YYYY" ise    → YYYY
  aksi halde Status Actual öyleyse → o yıl
  aksi halde Launch Sheet varsa    → o tarihin yılı
  hiçbiri yoksa                    → null ("yıl belirsiz")
```

`getParcaListesi()`/`getParcaDetay()` her satıra `planYear`/`planQuarter` ekler.
Dashboard'daki yıl segment kontrolü ve çeyreklik OI çizgi grafiği bunları kullanır — gerçek
bir sheet kolonu eklemek istenirse (`CLAUDE.md`'nin "kolon haritası satır satır taşınmaz"
notuyla uyumlu) `COLUMN_MAP`'e yeni bir satır eklenip bu iki fonksiyon o kolonu öncelikli
okuyacak şekilde güncellenebilir — şimdilik türetim yeterli görüldü.

## Otomasyon — Zamanlanmış Tetikleyici (madde 3)

`_setupApp()` tek seferlik kurulum fonksiyonu bir günlük `ScriptApp.newTrigger` kurar:
`dailyRiskScan_()` her gün `computeRiskLevel_` sonucu `'risk'` olan kayıtları tarar, sayıları
bir `Log` sekmesine yazar (mail atmak bu turda kapsam dışı — sekme yeterli, kullanıcı isterse
sonraki turda `MailApp` eklenir).

## Kullanım Logu (madde 8)

`doGet` her çağrıldığında `UsageLog` sekmesine `(tarih, kullanıcı e-postası, sayfa)` satırı
eklenir (best-effort, hata sayfayı bloklamaz). `getUsageSummary()` son 7 günün benzersiz
kullanıcı/oturum sayısını döner, Dashboard'da küçük bir "Kullanım" göstergesinde gösterilir.

## Minimum Test İskeleti (madde 9)

`tests/risk.test.js` — Node.js mock harness (`SpreadsheetApp` taklidi gerekmeden, saf
`Risk.gs` mantığı doğrudan test edilebilir) 13 golden-value senaryosu: `computeRiskLevel_`
için iki-kolon Launched kombinasyonları (yalnız Planned/ikisi de/hiçbiri), Delay/On-hold,
geçmiş/gelecek çeyrek, Actual sonradan Launched olma; `computePlanYear_`/`computePlanQuarter_`
için Planned→Actual→Launch Sheet öncelik sırası ve "hiçbiri yok" durumu.

## Wishlist — İkinci Veri Kaynağı (Ayrı Google Sheet)

Dashboard/Parça Listesi'nin okuduğu `Sheet1`'den **tamamen farklı** bir Google Sheet: kullanıcının
paylaştığı "Live Wishlist - Clutch CV AMEAO + Europe" tablosu (sekme `LIVE WISHLIST CV`).
Bu script'in bağlı olduğu Sheet DEĞİL — `SpreadsheetApp.openById(WISHLIST_SPREADSHEET_ID)` ile
açılıyor, yani bu webapp'i çalıştıran her kullanıcının kendi Google hesabıyla o sheet'e en az
görüntüleyici erişimi olması gerekiyor (paylaşım eksikse `getWishlistData()` `{error}` döner,
istemci "şu an alınamıyor + Tekrar dene" gösterir — çökmez).

```
Kullanıcı ↔ view-wishlist (aynı Index/Stylesheet/JavaScript.html içinde)
                 │  google.script.run getWishlistData()
                 ▼
            Code.gs  ──►  SpreadsheetApp.openById(WISHLIST_SPREADSHEET_ID)
                              .getSheetByName('LIVE WISHLIST CV')
```

### Veri Modeli — Sabit Kolon Haritası

Kaynak sheet'in gerçek yapısı: başlık **4. satırda** (bazı hücrelere Alt+Enter ile gömülü satır
sonları var — CSV dışa aktarımında bunlar "çok satırlı başlık" gibi görünüyordu, gerçek yapı tek
satır), veri **5. satırdan** başlıyor, toplam **95 sütun**. `Code.gs`'teki `WISHLIST_COLUMN_MAP`
seçilen ~29 alanı **sabit kolon numarasına** göre okur (`Sheet1`'in `COLUMN_MAP`'iyle aynı desen)
— başlık METNİNE göre değil, çünkü bazı başlıklar (`EUROPE`/`TMEAO`/`Americas`) sheet'te BİRDEN
FAZLA farklı bölümde (CarPark / VS Potential / Specific Target Prices) tekrarlanıyor, bu da
metin-eşlemeyi güvensiz kılıyor. Harita, kaynak sheet'in dışa aktarılmış bir kopyası tek tek
incelenerek (2026-09) çıkarıldı ve gerçek veriye karşı Node.js'te doğrulandı (290 satır, sıfır
sütun kayması). Sütunlar yeniden düzenlenirse `WISHLIST_COLUMN_MAP` elle güncellenmeli —
`_wishlistVerifyHeader_()` bunu SESSİZCE yanlış okumak yerine üç sabit noktada (WL YEAR/VS
Region/PROJECT STATUS başlıkları) doğrulayıp uyuşmazlıkta açık bir hata fırlatır (madde 2).

| Alan | Kaynak kolon | Not |
|---|---|---|
| `wlYear`, `category` | B, C | boş satır tespiti bu ikisine bakar |
| `productRange`, `dia`, `vsRegion` | F, G, H | |
| `projectCode`, `vsPartNumber`, `prio`, `notes` | K, L, M, N | |
| `manufacturer`, `model` | Q, R | |
| `competitorBrand`, `competitorProduct` | X, Y | |
| `totalVsPotential` | AK | **birim karışık** — bazı satırlarda hacim/adet, bazı satırlarda `TBD`/`-`/`?`; ham gösterilir, tek bir KPI'da toplanmaz |
| `priceEurope`/`priceTmeao`/`priceAmericas` | BU, BV, BW | format tutarsız (TR virgül ondalık, R$ Brezilya Reali, nokta ondalık) — `Wishlist.gs` `parseWishlistPrice_` normalize eder |
| `site`, `launchPlan`, `plannedMonth`, `projectStatusRaw`, `orderIntake` | CG, CH, CI, CJ, CK | |
| `action`, `reasonCancelled`, `samplesAvailability`, `technology` | CN, CO, CP, CQ | |

### PROJECT STATUS → `statusBucket` (StatusLex Deseni)

Ham `projectStatusRaw` serbest metin (290 satırın 143'ü boş, geri kalanı onlarca varyant) —
`Wishlist.gs` `wishlistStatusBucket_()` anahtar-kelime tabanlı (küçük/büyük harf duyarsız,
alt-metin eşleşmesi) 6 sabit kategoriye indirger: `Launched` · `CA` · `InDevelopment` ·
`CancelledOrNotAllocated` · `Unspecified` · `Other`. **Ham değere hiçbir yerde dokunulmaz** —
yalnız bu türetilmiş alan KPI/grafik kategorizasyonu için kullanılır, detay panelinde ham metin
ayrıca gösterilir (`dil-yerellestirme.md` `StatusLex` ilkesi, `Sheet1`'in `STATUS_LEX`'iyle aynı
mantık). Gerçek veride ölçülen dağılım (290 satır): Unspecified 143 · InDevelopment 36 ·
CancelledOrNotAllocated 53 · CA 25 · Launched 17 · Other 16.

### Dikkat Rozeti (madde 7)

```
wishlistAttention_(row):
  statusBucket == 'Launched'                                    → dikkat YOK
  Launch Plan "Q#/YYYY" (veya "Q# YYYY") biçiminde VE o çeyrek
    geçmişte                                                    → DİKKAT
  aksi hâlde (çeyrek ayrıştırılamıyorsa dahil)                   → dikkat YOK
```

`Sheet1`'in `computeRiskLevel_`'ıyla aynı çeyrek-ayrıştırma mantığını (`Risk.gs`
`parseQuarter_`) tekrar kullanmaz — Wishlist'in Launch Plan alanı ayrı bir format taşıdığı için
(`Wishlist.gs` kendi `parseWishlistQuarter_`'ı) küçük bir kopya tutuluyor; iki sheet'in kolon
anlamı farklı olduğundan ortak bir fonksiyona zorlanmadı.

### API — `getWishlistData()`

`_requireUser_()` ile başlar (madde 1). Satırları okur, her satıra `statusBucket`, `attention`,
`priceEuropeNum`/`priceTmeaoNum`/`priceAmericasNum` (parse edilmiş fiyat, yoksa `null`) ekler,
`{ ok:true, rows, updatedAt, sourceUrl }` döner. Dashboard'daki gibi **ayrı bir agregasyon uç
noktası yok** — `JavaScript.html`'deki `computeWishlistAggregates()` istemci tarafında hesaplar
(290 satır bu ölçekte tarayıcıda hesaplamak için küçük). Wishlist'in satır detay paneli de ayrı
bir uç noktaya gitmez — `Sheet1`'in düzenlenebilir `getParcaDetay()`'inden farklı olarak
salt-okunur olduğu için istemci önbelleğinden (`AppState.wishlist.rows`) okur.

### Minimum Test İskeleti (madde 9)

`tests/wishlist.test.js` — `tests/risk.test.js` ile aynı Node.js mock harness deseni, 32
golden-value senaryosu: `wishlistStatusBucket_` (gerçek sheet'te görülen varyantlar dahil),
`parseWishlistPrice_` (TR virgül/nokta ondalık/R$ Reali/boş-TBD-tire), `wishlistAttention_`
(geçmiş/gelecek çeyrek, zaten Launched, ayrıştırılamayan format). Ayrıca kolon haritası, gerçek
CSV dışa aktarımına karşı ayrı bir Node.js betiğiyle (bu depoda tutulmuyor, bir kerelik doğrulama)
290 satır üzerinde sıfır sütun-kayması ile doğrulandı — sonuç bu dosyaya not düşüldü, testin
kendisine değil (gerçek veri dosyası repoya girmiyor).

## Auth Modeli

Web app dağıtımı "Yalnız bu tabloya erişimi olanlar" (Sheet paylaşım izinleriyle aynı çember)
olarak yapılandırılır — gerçek erişim kontrolü Google'ın kendi paylaşım/deployment ayarında,
`_requireUser_()` yalnız oturumun geçerli olduğunu doğrular (madde 1: menüde gizlemek yetki
sayılmaz — burada gerçek sınır deployment ayarındadır, kod tarafı ekstra bir rol kontrolü
gerektirmez çünkü tek rol var).
