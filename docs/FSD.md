# FSD — Fonksiyonel Davranış

## Genel Kabuk

- Header: sabit, `--valeo-blue` zemin, solda logo, ortada sayfa başlığı, sağda koyu-mod
  düğmesi + dil düğmesi (TR/EN).
- Sol: masaüstünde statik ikon-sidebar (Dashboard, Parça Listesi, Wishlist — 3 öğe,
  `sidebar.md`'nin "az sayfalı basit araç" istisnası); ≤768px'te sidebar gizlenir, ekran
  altında bottom-nav (aynı 3 öğe) belirir.
- Detay Paneli, Dashboard ve Parça Listesi'nin ortak paylaştığı, sağdan giren düzenlenebilir
  bir drawer. **Wishlist Detay Paneli AYRI bir bileşen** — salt-okunur (InfoModal deseni,
  `detay-popup.md`), kendi state'ini (`AppState.wishlistDrawer`) ve kendi DOM'unu
  (`#wishlist-drawer`) taşır; Detay Paneli'nin düzenleme/kaydetme mantığına dokunmaz.

## Ekran: Dashboard (varsayılan açılış)

- Salt-okunur (jenerik-desenler.md "Sinoptik Görünüm" kuralı — form/düzenleme barındırmaz).
- **Yıl segment kontrolü** (Tümü/2026/2027/…, `bilesenler.md` Segment Kontrolü) + **Genel
  Arama** (virgülle ayrılmış çoklu terim, OR eşleşme, P/N+Plant+Product+Project Type+Status
  üzerinde) aynı satırda. Varsayılan yıl mevcut takvim yılı — "Tümü" değil, kullanıcı talebiyle
  (bu yılın planı gelecek yılınkiyle karışmasın). Sayfadaki KPI/grafik/gruplu-tablo/risk-tablosu
  hem yıl hem arama filtresine göre önceden süzülmüş satır kümesinden hesaplanır — her
  değişiklikte yeniden hesaplanır (istemci tarafı, `computeDashboardAggregates()`).
- KPI şeridi: Toplam Parça · Toplam Hacim · Toplam EUR · Launched Sayısı · Risk/Gecikme Sayısı.
- **Çeyreklik OI çizgi grafiği**: seçili yılın Q1-Q4'ü için kümülatif Order Intake (K),
  başlıkta "{Yıl} Order Intake ⇒ {toplam}". Yıl filtresi "Tümü"yse bile bu grafik tek bir
  (varsayılan) yılı gösterir — 4 çeyrek yapısı bir yıl gerektirir.
- **4 grafik** (doughnut/bar karışık, `PALETTE`'ten türetilmiş): Plant (A) dağılımı (doughnut) ·
  Project Type (B) bazında Hacim (yatay bar) · Project Type (B) bazında Order Intake (yatay
  bar) · Ürün (F) bazlı hacim (yatay bar). **Dördü de tıklanınca** üstteki genel arama kutusunu
  tıklanan değerle doldurup sayfayı yerinde yeniden süzer (`grafikler.md` "grafik = filtre
  kontrolü" — Parça Listesi'ne gitmez, aynı sayfada filtreler).
- **İki gruplu toplam tablosu**: Diameter (C) × Plant (A) ve Project Type (B) × Product (F)
  bazında K (OI) toplamı, azalan sırada.
- Risk/Gecikme tablosu: yalnız `risk`/`gecikme` rozetli kayıtlar, **kendi yerel arama
  kutusuyla** (genel aramadan bağımsız, yalnız bu tabloyu daraltır). P/N sütunu tıklanabilir
  → Detay Paneli açar.
- Veri yüklenemezse (sunucu hatası) KPI kartları sıfır göstermez — "şu an alınamıyor" + Tekrar
  Dene düğmesi (`grafikler.md` "Yüklenemeyen veri ≠ Boş veri").

## Ekran: Parça Listesi

- Üstte filtre barı: Plant / Product / Status için `FilterDrop` çoklu seçim + serbest arama
  kutusu (P/N ve Plant üzerinde, Türkçe karakter-duyarsız normalize ile).
- Aktif filtre chip'leri, "Filtreyi Temizle" (Boş Ekran şablonuyla aynı isim).
- Tablo: Plant, P/N, Product, Volume, OI, Status (rozet), Planned (ham Status Planned çeyreği)
  — görünür varsayılan kolonlar (14+ kolonu mobilde/kart görünümde yönetilebilir tutmak için);
  geri kalan alanlar (Status Actual dahil) Detay Panelinde. Sütun başlığına tıklamak sıralar.
- **P/N hücresine tıklamak (veya Enter/Space ile odaklanıp aktive etmek) Detay Panelini açar**
  — gerçek `<button>` üzerinden, `<td onclick>` değil (madde 5: klavye erişimi).
- ≤768px: tablo `mobileCards()` deseniyle karta döner, her kart P/N'i başlık olarak taşır.
- Durum sütunu Durum Rozeti (Status chip) ile gösterilir; risk/gecikme kayıtlarda ek bir
  uyarı ikonu (`alert-triangle`, Lucide).

## Ekran: Wishlist

- Ayrı bir Google Sheet'ten okur ("Live Wishlist - Clutch CV AMEAO + Europe", bkz. `TSD.md`
  "Wishlist" bölümü) — Dashboard/Parça Listesi'nin `Sheet1`'iyle karıştırılmaz.
- Salt-okunur (Dashboard'la aynı "Sinoptik Görünüm" kuralı). Tek sayfada KPI şeridi + 4 grafik
  + filtrelenebilir tam tablo birleşik — ayrı bir "genel bakış"/"tüm kayıtlar" ekran ikilisine
  bölünmedi (300 satırın altındaki küçük tek-kaynaklı bir ekran, `mvp-akisi.md` orantılı
  mühendislik ilkesi). Detay: `docs/layout-wishlist.md`.
- KPI şeridi: Toplam Proje · Launched · CA Aşamasında · Geliştirmede · İptal/Tahsis Edilmedi ·
  **Dikkat** (Launch Plan hedeflenen çeyreği geçmiş + proje hâlâ Launched değil).
- 4 grafik (`PALETTE`'ten türetilmiş, doughnut/bar karışık): Durum Dağılımı · Yıla Göre Proje
  Sayısı · Bölge Dağılımı · Site Dağılımı. Grafiklerin `onClick` filtreye bağlanması bu turda
  YOK (Dashboard'daki gibi tek bir genel arama kutusuna beslenecek ayrı bir üst filtre satırı
  yok — filtre barının kendi `FilterDrop`'ları zaten aynı işi görüyor).
- Filtre barı: WL Year / Kategori / VS Region / Site / Durum için `FilterDrop` çoklu seçim +
  serbest arama kutusu (Proje Kodu, Üretici, Model, VS Part Number, Teknoloji, Notlar üzerinde,
  Türkçe karakter-duyarsız). Aktif filtre chip'leri, "Filtreyi Temizle".
- Tablo: WL Year, Kategori, Üretici, Model, VS Region, Site, Launch Plan, Durum (rozet) —
  görünür varsayılan kolonlar. **Üretici hücresine tıklamak (veya Enter/Space) Wishlist Detay
  Panelini açar** — gerçek `<button>` üzerinden (madde 5). ≤768px: `mobileCards()` ile karta
  döner.
- Dikkat rozetli satırlarda Üretici hücresinin yanında bir uyarı ikonu (Parça Listesi'ndeki
  risk bayrağıyla aynı görsel dil).
- Veri yüklenemezse (paylaşım eksik/ağ hatası) KPI'lar sıfır göstermez — "şu an alınamıyor" +
  Tekrar Dene düğmesi.

## Wishlist Detay Paneli — Sağdan Açılır, Salt-Okunur

- Açılış kaynağı: Wishlist tablosunun görünen (filtrelenmiş/sıralanmış) satır sırası; önceki/
  sonraki oklar o sırada gezinir (Detay Paneli'yle aynı desen, ayrı state).
- Ayrı bir `google.script.run` çağrısı YAPMAZ — satır zaten `AppState.wishlist.rows`
  önbelleğinde, panel doğrudan oradan okur (InfoModal ilkesi: hızlı bakış, ikinci bir okuma
  açmaz).
- İçerik "künye + neden + aksiyon" şablonunu izler (`detay-popup.md`): Kimlik bölümü (Üretici/
  Model/Kategori/Ürün Grubu/Dia/VS Region/Proje Kodu/VS Part Number/Öncelik) → Ticari bölümü
  (Site/Teknoloji/Launch Plan/Planlanan Ay/Rakip Marka-Ürün/3 bölgesel Hedef Fiyat/Order
  Intake/Toplam VS Potansiyeli/Numune Durumu) → Durum & Aksiyon bölümü (Durum Rozeti + **ham**
  `PROJECT STATUS` metni + Aksiyon + İptal/Tahsis Sebebi + Notlar) → varsa kaynak Google
  Sheet'e "Sheet'te aç" linki.
- **Düzenleme yok** — hiçbir alan tıklanabilir/aktifleştirilebilir değil (Detay Paneli'nin
  `activateEdit`/`saveField` mekanizmasının hiçbiri burada kullanılmaz). Bir alan
  düzenlenebilir olması gerekirse bu, Wishlist verisinin kendisinin çift yönlü hale
  getirilmesi anlamına gelir — bu turun kapsamı dışında (kullanıcı yalnız görüntüleme istedi).
- Kapatma: X düğmesi, Escape, veya scrim'e tıklama — Detay Paneli açıkken Wishlist Detay
  Paneli açılamaz (ayrı sayfalar), ama ikisinin de kendi Escape/scrim mantığı var, kademeli
  önceliklendirilmiş (`wireShell()`'de en üstteki katman önce kapanır).

## Detay Paneli (Drawer) — Sağdan Açılır

- Açılış kaynağı: Parça Listesi'nin görünen (filtrelenmiş/sıralanmış) satır sırası veya
  Dashboard'un risk tablosu. Panel hangi listeden açıldığını bilir; önceki/sonraki oklar o
  liste içinde gezinir. Dashboard'un risk tablosundan açılan bir kayıt Parça Listesi'nin genel
  sıralamasında farklı bir yerdeyse "Opened from a different list" metni gösterilir
  (`detay-panel.md`).
- "Özellik satırı" deseni: her alan ikon + etiket + değer; değere tıklamak (veya
  Enter/Space) satırı yerinde bir düzenleme kontrolüne çevirir.
  - **Metin/serbest alanlar** (P/N Competitor, Attribute 1/2/3): `<input>`.
  - **Sayısal alanlar** (Volume, OI, Coverage+, EUR): `<input type=number>`.
  - **Status Planned, Status Actual ve 9 kilometre taşı:** `<input list=… ><datalist>` —
    Sheet'te gözlemlenen değerlerden (`Done`, `Not Required`, `TBD`, `Q1/2027`, `Launched`
    gibi) öneri sunar ama serbest yazıma kapatmaz (gerçek veri her zaman sabit bir enum'a
    uymayabilir). Bir proje yalnız **ikisi de** `Launched` yazınca tam tamamlanmış sayılır.
  - **Launch Sheet (W, tarih):** `<input type=date>`.
- Bir alan kaydedilince: savebar "Saving…" → "Saved" gösterir, ardından 5 saniyelik Undo
  toast'ı çıkar (geri alması ucuz bir tekli hücre yazımı — `bilesenler.md` Undo Toast
  kuralı). Sunucu hata dönerse savebar "Not saved — try again" gösterir, hücre eski değerine
  döner.
- Düzenlenemeyen alanlar (Plant, Project Type, Diameter — kaynak veri kimliği) hiçbir zaman
  tıklanabilir görünmez.
- Kapatma: X düğmesi, Escape, veya scrim'e tıklama.

## Erişilebilirlik Kontrat Listesi

- Tüm birincil eylemler (satır açma, sıralama, filtre, önceki/sonraki, düzenle) gerçek
  `<button>` — `tabindex`/`role` hilesi yok.
- Her form alanı `<label for>` ile gerçekten bağlı.
- Kaydetme/hata durum mesajları `aria-live="polite"` (hata: `assertive`) taşır; KPI sayıları
  gibi sık güncellenen alanlara `aria-live` eklenmez.
- `:focus-visible`, `prefers-reduced-motion`, `.skip-link`, `.sr-only` — proje geneli, bkz.
  `jenerik-desenler.md` madde 8.

## Dark Mode / Dil / Mobil (varsayılan)

- Açılışta kayıtlı tercih (sunucu, `PropertiesService`) > yoksa OS tercihi.
- `T`/`t()` sözlüğü TR/EN; `document.documentElement.lang` dil değişince güncellenir; sayı/
  tarih biçimi (`toLocaleString`) dile göre `tr-TR`/`en-US` seçilir; Status/kilometre taşı
  gibi sabit değerler de `t()` kapsamında (StatusLex deseni).
- ≤768px: sidebar gizlenir, bottom-nav (Dashboard, Liste, Wishlist) belirir; drawer tam
  genişliğe yakın açılır (`min(520px,94vw)` zaten dar ekranda ekranın çoğunu kaplar) — hem
  Detay Paneli hem Wishlist Detay Paneli için aynı ölçü.
