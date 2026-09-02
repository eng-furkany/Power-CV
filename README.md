# Power CV Launch Plan Dashboard

Europe/TMEAO Power CV lansman planı için Google Sheets üzerinde çalışan, çift yönlü, koyu
mod + TR/EN destekli, mobil uyumlu bir Apps Script web dashboard'u.

Standartlar reposundaki (`eng-furkany/standartlar`) tasarım desenlerinin uygulaması —
kaynak kararlar için `docs/PRD.md`, `docs/TSD.md`, `docs/FSD.md`, `docs/layout-*.md`.

## Ekranlar

- **Dashboard** — KPI özeti, durum dağılım grafiği, ürün bazlı hacim grafiği, risk/gecikme
  tablosu.
- **Parça Listesi** — filtrelenebilir/sıralanabilir tam tablo, mobilde kart görünümü.
- **Detay Paneli** — Parça Listesi'nde veya Dashboard'un risk tablosunda **D kolonundaki
  P/N referansına tıklayınca** sağdan açılan, düzenlenebilir panel (9 kilometre taşı dahil).
- **Wishlist** *(2026-09 eklentisi)* — **ayrı bir Google Sheet'ten** ("Live Wishlist - Clutch
  CV AMEAO + Europe") beslenen, salt-okunur üçüncü sayfa: KPI şeridi (Toplam/Launched/CA/
  Geliştirmede/İptal-Tahsis Edilmedi/Dikkat) + 4 grafik (Durum/Yıl/Bölge/Site dağılımı) +
  filtrelenebilir tam tablo. Üretici hücresine tıklamak salt-okunur bir Wishlist Detay
  Paneli açar (Detay Paneli'nden farklı — düzenleme yok, InfoModal deseni). Detay:
  `docs/TSD.md` "Wishlist" bölümü, `docs/layout-wishlist.md`.

## Dosya Yapısı

```
Code.gs               sunucu: doGet, CRUD, yetki kontrolü, günlük risk taraması, kullanım logu,
                       + Wishlist bölümü (getWishlistData, ayrı sheet okuma)
Risk.gs                saf risk hesaplama mantığı (Node.js'te de test edilebilir, Sheet1 için)
Wishlist.gs             saf Wishlist mantığı (durum-bucket eşleme, fiyat parse, dikkat rozeti —
                        Node.js'te de test edilebilir)
appsscript.json        Apps Script manifest (webapp erişimi: DOMAIN + USER_ACCESSING)
Index.html              HtmlService kabuğu (include ile Stylesheet/JavaScript'i çeker)
Stylesheet.html         tüm CSS — renk token'ları, dark mode, responsive kurallar (Wishlist
                        hiçbir yeni CSS sınıfı eklemedi, tamamı mevcut bileşenleri yeniden kullanıyor)
JavaScript.html         tüm istemci mantığı — routing, i18n, filtre, drawer, grafikler,
                        + Wishlist sayfası/detay paneli
tests/risk.test.js      golden-value testleri (`node tests/risk.test.js`)
tests/wishlist.test.js  golden-value testleri (`node tests/wishlist.test.js`)
docs/                   PRD/TSD/FSD/Layout MD — plan onayı çıktıları
assets/                 logo kaynak dosyaları (Index.html'e base64 gömülü, ayrıca burada referans)
```

## Kurulum — Gerçek Sheet'e Bağlama

1. Bu proje zaten bir Google Sheet'e container-bound Apps Script olarak oluşturuldu
   (Script ID `.clasp.json` içinde kayıtlı).
2. `Code.gs`'teki `SHEET_NAME = 'Sheet1'` — kendi Sheet'inizde sekme adı farklıysa güncelleyin.
3. Kolon eşlemesi `Code.gs`'teki `COLUMN_MAP`'te — kendi tablonuzun kolon sırası farklıysa
   (bu proje örnek/maskelenmiş bir dosyadan çıkarıldı, bkz. `docs/PRD.md` "Kaynak Veri —
   Bilinen Sınırlamalar") tek noktadan güncelleyin.
4. **Wishlist sayfası için ek adım:** `Code.gs`'teki `WISHLIST_SPREADSHEET_ID` — kaynak Live
   Wishlist Google Sheet'in kendi ID'si (şu an
   `1KB_-wTAFxPsaxMmMC2YODLPyB7JL0NsPgLvsiBoWFQQ` olarak ayarlı). Bu Apps Script projesini
   çalıştıran **her kullanıcının kendi Google hesabıyla** bu sheet'e en az görüntüleyici
   olarak paylaşılmış olması gerekir (`executeAs: USER_ACCESSING`) — paylaşım yoksa Wishlist
   sayfası "şu an alınamıyor" hatası gösterir, uygulamanın geri kalanı etkilenmez. Sheet
   yeniden düzenlenirse (sütun eklenip/çıkarılırsa) `WISHLIST_COLUMN_MAP` elle güncellenmeli —
   bkz. `docs/TSD.md` "Wishlist" bölümü. **Not:** `SpreadsheetApp.openById()` ile başka bir
   sheet'e açılmak, önceki sürümde istenen `spreadsheets.currentonly` yerine daha geniş
   `spreadsheets` OAuth kapsamını gerektiriyor — bu push'tan sonra kullanıcılar ilk açılışta
   yeniden bir izin (consent) ekranı görebilir, bu beklenen bir durum.
5. Apps Script projesine kod göndermek için (`clasp push`) Claude Code'a *"Apps Script'e push
   et"* deyin — `apps-script-push` skill'i devreye girer (OAuth, onay, push sırasını yönetir).
6. Push sonrası Apps Script editöründen (`script.google.com`) **bir kez elle** `_setupApp()`
   fonksiyonunu çalıştırın — günlük risk taraması tetikleyicisini kurar (madde 3, minimum
   otomasyon).
7. **Deploy > New deployment > Web app** — "Execute as: User accessing the web app",
   "Who has access: Anyone within [domain]" (bkz. `appsscript.json`).

## Testler

```
node tests/risk.test.js
node tests/wishlist.test.js
```

Risk/gecikme rozeti mantığı (`Risk.gs`) için 13, Wishlist durum-bucket/fiyat-parse/dikkat
rozeti mantığı (`Wishlist.gs`) için 32 golden-value senaryosu.

## Bilinen Sınırlamalar / Sonraki Adımlar

- G/H/I kolonlarının (`Attribute PPCA/Disc/RB`) gerçek iş kuralı örnek veride belirsizdi —
  bkz. `docs/TSD.md`.
- Çoklu rol (görüntüleyici/editör ayrımı) bu turda yok — tek rol yeterli görüldü.
- Wishlist'teki `totalVsPotential` alanı birim karışık (bazı satırlarda hacim/adet, bazı
  satırlarda `TBD`/`-`/`?`) — ham gösteriliyor, tek bir KPI'da toplanmadı (bkz. `docs/TSD.md`).
  Gerçek bir "toplam potansiyel" KPI'sı isteniyorsa önce kaynak sheet'teki VS Potential bölge
  kırılımı (VSF/VSE/VSAT/... sütunları, bu turda okunmadı) ile birlikte netleştirilmeli.
- Wishlist'in 95 sütununun yalnız ~29'u okunuyor (bkz. `docs/TSD.md` tablosu) — geri kalanı
  (IAM Cross referansları, CarPark bölge kırılımı, RCSP YEAR1-5, VPH/Chennai/Nanjing kapasite)
  bu turda dashboard'a dahil edilmedi, öncelik sırasına göre seçildi.
- MVP tamamlandıktan sonra `eng-furkany/ExpertAI` ile denetlenip bulgulara göre
  düzeltilmesi önerilir (bkz. Standartlar `docs/mvp-akisi.md` adım 7-8).
