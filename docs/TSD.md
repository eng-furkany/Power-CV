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
| M | Status | metin | `Launched` veya hedef çeyrek (`Q4/2026` gibi) veya `Delay`/`Risk`/`On-hold` |
| N–V | 9 kilometre taşı | metin/tarih | Sample Purchase, Competitor Analysis, Product Definition, Commercial Agreement, Sample Production, Bench testing, Vehicle Test, CRD, Launch Sheet — değerler `Done`/`Not Required`/`TBD`/çeyrek string; **V (Launch Sheet) bir tarih** |
| AA | EUR | sayı | |

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
  Status == 'Launched'                        → 'ontrack'
  Status /delay|risk|on.?hold/i                → 'risk'   (yüksek)
  Launch Sheet tarihi geçmişte VE Status ≠ Launched → 'risk'  (gecikmiş lansman)
  Status bir çeyrek string'i (Q#/YYYY) VE o çeyrek geçmişte → 'gecikme' (uyarı)
  aksi hâlde                                   → 'ontrack'
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
  Status "Q#/YYYY" ise           → YYYY
  aksi halde Launch Sheet varsa  → o tarihin yılı
  ikisi de yoksa                 → null ("yıl belirsiz")
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
`computeRiskLevel_` mantığı `Code.gs`'ten çıkarılıp test edilebilir hale getirildi) 5
golden-value senaryosu: Launched, Delay durumu, geçmiş çeyrek, gelecek çeyrek, geçmiş Launch
Sheet tarihi.

## Auth Modeli

Web app dağıtımı "Yalnız bu tabloya erişimi olanlar" (Sheet paylaşım izinleriyle aynı çember)
olarak yapılandırılır — gerçek erişim kontrolü Google'ın kendi paylaşım/deployment ayarında,
`_requireUser_()` yalnız oturumun geçerli olduğunu doğrular (madde 1: menüde gizlemek yetki
sayılmaz — burada gerçek sınır deployment ayarındadır, kod tarafı ekstra bir rol kontrolü
gerektirmez çünkü tek rol var).
