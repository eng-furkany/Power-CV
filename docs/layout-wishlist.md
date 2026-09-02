## Wishlist (Sinoptik + Tam Tablo Birleşik)

- Header/Sol: Dashboard ve Parça Listesi ile aynı kabuk (bkz. `layout-dashboard.md`) — sidebar/
  bottom-nav'a üçüncü bir `data-nav="wishlist"` öğesi eklendi, ikinci bir kabuk kurulmadı.
- Veri kaynağı Dashboard/Liste'nin okuduğu `Sheet1`'den **farklı, ayrı bir Google Sheet**
  ("Live Wishlist - Clutch CV AMEAO + Europe", sekme `LIVE WISHLIST CV`) — bkz. `TSD.md`
  "Wishlist" bölümü. Bu yüzden ekranın kendi ayrı bir `getWishlistData()` uç noktası var,
  Dashboard'un `getParcaListesi()`'siyle karıştırılmamalı.
- Ana alan (üstten alta), Dashboard'un Sinoptik deseniyle Liste'nin tam tablosunun birleşimi
  — iki ayrı sayfaya bölünmedi çünkü tek bir veri kaynağından besleniyor ve 300 satırın altında
  kalan küçük bir ekran (`mvp-akisi.md` orantılı mühendislik ilkesi):
  - **Güncelleme zamanı** — sayfa başlığı altında küçük bir "Güncelleme: {tarih}" notu
    (`getWishlistData()`'nın döndürdüğü `updatedAt`).
  - **KPI şeridi** — 6 `.kpi-card`: Toplam Proje, Launched, CA Aşamasında, Geliştirmede,
    İptal/Tahsis Edilmedi, **Dikkat** (Launch Plan hedeflenen çeyreği geçmiş ama proje hâlâ
    Launched değil — `muhendislik-standartlari.md` madde 7, `Wishlist.gs` `wishlistAttention_`).
  - **4 grafik** (`chart-grid`): Durum Dağılımı (doughnut, `statusBucket`) · Yıla Göre Proje
    Sayısı (yatay bar, `WL YEAR`) · Bölge Dağılımı (doughnut, `VS Region`) · Site Dağılımı
    (yatay bar, `SITE`). Dashboard'daki gibi `PALETTE`'ten türetilmiş renkler kullanılıyor,
    ayrı bir grafik paleti icat edilmedi.
  - **Filtre Barı** — WL Year / Kategori / VS Region / Site / Durum için `FilterDrop` çoklu
    seçim + arama kutusu (Proje Kodu, Üretici, Model, VS Part Number, Teknoloji üzerinde OR
    eşleşme, Türkçe karakter-duyarsız) + aktif filtre chip'leri — Parça Listesi'nin aynı
    deseninin bir kopyası, kendi `AppState.wishlist.filters` durumunu taşır (Liste'ninkiyle
    KARIŞTIRILMAZ).
  - **Veri Tablosu** — görünür kolonlar: WL Year, Kategori, Üretici (**tıklanabilir referans**),
    Model, VS Region, Site, Launch Plan, Durum (rozet). Dikkat rozetli satırlarda Üretici
    hücresinin yanında bir uyarı ikonu. ≤768px'te `mobileCards()` ile karta döner (aynı CSS,
    ikinci bir mobil görünüm kodu yazılmadı).
- Eylemler: sütun başlığı = sırala, filtre ikonu = `FilterDrop` aç, Üretici hücresi = Wishlist
  Detay Paneli aç.
- **Wishlist Detay Paneli** — Parça Detayı'ndan (drawer) FARKLI bir bileşen: salt-okunur bir
  InfoModal-tarzı hızlı bakış (`detay-popup.md`), düzenleme YOK. Ayrı bir sunucu çağrısı
  yapmaz — satır zaten istemci önbelleğinde (`AppState.wishlist.rows`), oradan okur. İçerik:
  Kimlik (Üretici/Model/Kategori/Ürün Grubu/Dia/VS Region/Proje Kodu/VS Part Number/Öncelik) →
  Ticari (Site/Teknoloji/Launch Plan/Planlanan Ay/Rakip Marka-Ürün/Hedef Fiyatlar/Order
  Intake/Toplam VS Potansiyeli/Numune Durumu) → Durum & Aksiyon (Durum Rozeti + **ham**
  `PROJECT STATUS` metni + Aksiyon + İptal/Tahsis Sebebi + Notlar — StatusLex ilkesi: ham
  değer hiç çevrilmez/değiştirilmez) → varsa "Sheet'te aç" düğmesi (kaynak Google Sheet'e
  yeni sekmede link). Önceki/sonraki gezinme, açıldığı filtrelenmiş listenin sırasını takip
  eder (Parça Detayı'yla aynı desen).
- Veri yüklenemezse (paylaşım eksik/ağ hatası) KPI'lar sıfır göstermez — "şu an alınamıyor" +
  Tekrar Dene düğmesi (`grafikler.md` "Yüklenemeyen veri ≠ Boş veri", Dashboard'daki aynı
  kural).
