# Power CV Launch Plan Dashboard

Europe/TMEAO Power CV lansman planı için Google Sheets üzerinde çalışan, çift yönlü, koyu
mod destekli, mobil uyumlu bir Apps Script web dashboard'u. Arayüz dili İngilizce'dir
(2026-09-01 kararı: kullanıcı talebiyle TR/EN dil değiştirici kaldırıldı, tek dil İngilizce'ye
sabitlendi — bkz. `docs/dil-yerellestirme.md`'nin bu projeye "gerek yok" denerek uygulanmayan
istisnası).

Standartlar reposundaki (`eng-furkany/standartlar`) tasarım desenlerinin uygulaması —
kaynak kararlar için `docs/PRD.md`, `docs/TSD.md`, `docs/FSD.md`, `docs/layout-*.md`.

## Ekranlar

Tek sayfa, gezinme yok (2026-09-01 kararı: Parça Listesi ayrı bir sekme değil Dashboard'un
altına gömülü — üst yönetim sunumu için sadeleştirme talebi; aynı gerekçeyle sidebar/mobil
alt navigasyon da kaldırıldı, tek sayfada gidilecek başka bir yer kalmadı):

- **Dashboard** — KPI özeti; yıllık Order Intake çizgi grafiği (varsayılan çok kompakt/
  eksensiz, başlıkta Plan/Actual/Δ özetiyle — Plan K kolonundan, Actual X kolonundan (yeni
  eklenen `oiActual`), sağ üstteki düğmeyle tam detaya büyütülebilir); pasta grafiklerde
  dilim üstünde her zaman yüzde; çubuk grafikler büyükten küçüğe sıralı; Diameter × Plant ve
  Project Type × Product çapraz tabloları (ikincil boyut kolon, en büyük 6 + "Other" —
  ör. Amiens/Bursa aynı Diameter satırında yan yana); risk/gecikme tablosu.
- **Parça Listesi** — aynı sayfanın altında, kapalı başlayan, düğmeyle açılıp kapanan bir
  bölüm; filtrelenebilir/sıralanabilir tam tablo, mobilde kart görünümü.
- **Detay Paneli** — Parça Listesi'nde veya Dashboard'un risk tablosunda **D kolonundaki
  P/N referansına tıklayınca** sağdan açılan, düzenlenebilir panel (9 kilometre taşı dahil).

## Dosya Yapısı

```
Code.gs               sunucu: doGet, CRUD, yetki kontrolü, günlük risk taraması, kullanım logu
Risk.gs                saf risk hesaplama mantığı (Node.js'te de test edilebilir)
appsscript.json        Apps Script manifest (webapp erişimi: DOMAIN + USER_ACCESSING)
Index.html              HtmlService kabuğu (include ile Stylesheet/JavaScript'i çeker)
Stylesheet.html         tüm CSS — renk token'ları, dark mode, responsive kurallar
JavaScript.html         tüm istemci mantığı — filtre, drawer, grafikler (İngilizce metin sözlüğü T/t())
tests/risk.test.js      golden-value testleri (`node tests/risk.test.js`)
docs/                   PRD/TSD/FSD/Layout MD — plan onayı çıktıları
assets/                 logo kaynak dosyaları (Index.html'e base64 gömülü, ayrıca burada referans)
```

## Kurulum — Gerçek Sheet'e Bağlama

1. Bu proje zaten bir Google Sheet'e container-bound Apps Script olarak oluşturuldu
   (Script ID `.clasp.json` içinde kayıtlı).
2. `Code.gs`'teki `SHEET_NAME = 'Sheet1'` — kendi Sheet'inizde sekme adı farklıysa güncelleyin.
3. Kolon eşlemesi `Code.gs`'teki `COLUMN_MAP`'te — kendi tablonuzun kolon sırası farklıysa
   (bu proje örnek/maskelenmiş bir dosyadan çıkarıldı, bkz. `docs/PRD.md` "Kaynak Veri —
   Bilinen Sınırlamalar") tek noktadan güncelleyin. `X` kolonu (`oiActual`) gerçekleşen Order
   Intake'i tutar — K kolonundaki (planlanan OI) karşılığı, yıllık çizgi grafikte Plan/Actual
   karşılaştırması için kullanılır.
4. Apps Script projesine kod göndermek için (`clasp push`) Claude Code'a *"Apps Script'e push
   et"* deyin — `apps-script-push` skill'i devreye girer (OAuth, onay, push sırasını yönetir).
5. Push sonrası Apps Script editöründen (`script.google.com`) **bir kez elle** `_setupApp()`
   fonksiyonunu çalıştırın — günlük risk taraması tetikleyicisini kurar (madde 3, minimum
   otomasyon).
6. **Deploy > New deployment > Web app** — "Execute as: User accessing the web app",
   "Who has access: Anyone within [domain]" (bkz. `appsscript.json`).

## Testler

```
node tests/risk.test.js
```

Risk/gecikme rozeti mantığı (`Risk.gs`) için 5 golden-value senaryosu.

## Bilinen Sınırlamalar / Sonraki Adımlar

- G/H/I kolonlarının (`Attribute PPCA/Disc/RB`) gerçek iş kuralı örnek veride belirsizdi —
  bkz. `docs/TSD.md`.
- Çoklu rol (görüntüleyici/editör ayrımı) bu turda yok — tek rol yeterli görüldü.
- MVP tamamlandıktan sonra `eng-furkany/ExpertAI` ile denetlenip bulgulara göre
  düzeltilmesi önerilir (bkz. Standartlar `docs/mvp-akisi.md` adım 7-8).
