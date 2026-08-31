# FSD — Fonksiyonel Davranış

## Genel Kabuk

- Header: sabit, `--valeo-blue` zemin, solda logo, ortada sayfa başlığı, sağda koyu-mod
  düğmesi + dil düğmesi (TR/EN).
- Sol: masaüstünde statik ikon-sidebar (Dashboard, Parça Listesi — 2 öğe, `sidebar.md`'nin
  "az sayfalı basit araç" istisnası); ≤768px'te sidebar gizlenir, ekran altında bottom-nav
  (aynı 2 öğe) belirir.
- Detay Paneli her iki ekrandan da açılabilen, sağdan giren ortak bir drawer.

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
- Tablo: Plant, P/N, Product, Volume, OI, Status, Launch (Sheet) — görünür varsayılan kolonlar
  (13+ kolonu mobilde/kart görünümde yönetilebilir tutmak için); geri kalan alanlar Detay
  Panelinde. Sütun başlığına tıklamak sıralar.
- **P/N hücresine tıklamak (veya Enter/Space ile odaklanıp aktive etmek) Detay Panelini açar**
  — gerçek `<button>` üzerinden, `<td onclick>` değil (madde 5: klavye erişimi).
- ≤768px: tablo `mobileCards()` deseniyle karta döner, her kart P/N'i başlık olarak taşır.
- Durum sütunu Durum Rozeti (Status chip) ile gösterilir; risk/gecikme kayıtlarda ek bir
  uyarı ikonu (`alert-triangle`, Lucide).

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
  - **Status ve 9 kilometre taşı:** `<input list=… ><datalist>` — Sheet'te gözlemlenen
    değerlerden (`Done`, `Not Required`, `TBD`, `Q1/2027` gibi) öneri sunar ama serbest yazıma
    kapatmaz (gerçek veri her zaman sabit bir enum'a uymayabilir).
  - **Launch Sheet (V, tarih):** `<input type=date>`.
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
- ≤768px: sidebar gizlenir, bottom-nav (Dashboard, Liste) belirir; drawer tam genişliğe yakın
  açılır (`min(520px,94vw)` zaten dar ekranda ekranın çoğunu kaplar).
