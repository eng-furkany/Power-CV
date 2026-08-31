## Dashboard (Sinoptik Görünüm)

- Header: sabit yükseklik, `tokens/colors.css --valeo-blue` zemin, sol logo + "Power CV Launch
  Plan" başlığı, sağ koyu-mod/dil düğmeleri (bkz. `baslarken.md` #3).
- Sol: statik ikon-sidebar (Dashboard aktif) — masaüstü/tablet; ≤768px'te bottom-nav
  (`sidebar.md` "Adaptif Navigasyon Katmanları").
- Ana alan (üstten alta):
  - **Filtre satırı** — sol tarafta bir **Yıl segment kontrolü** (Tümü/2026/2027/… —
    `bilesenler.md` Segment Kontrolü deseni; kaynak alan Sheet1'de yok, `Risk.gs`
    `computePlanYear_`'dan türer, bkz. `TSD.md`), sağ tarafta virgülle ayrılmış çoklu terim
    kabul eden **Genel Arama** kutusu (P/N, Plant, Product, Project Type, Status üzerinde OR
    eşleşme, Türkçe karakter-duyarsız). Aşağıdaki KPI/grafik/gruplu-tablo/risk-tablosu
    bölümlerinin TAMAMI hem yıl hem arama filtresine göre önceden süzülür — varsayılan yıl
    "Tümü" değil, mevcut takvim yılı (bu yılın planı gelecek yılınkiyle karışmasın diye).
  - **KPI şeridi** — 5 `.kpi-card` (Toplam Parça, Toplam Hacim, Toplam EUR, Launched,
    Risk/Gecikme) — `jenerik-desenler.md` Kart/KPI Kartı.
  - **Çeyreklik OI çizgi grafiği** — seçili yılın 4 çeyreği (Q1-Q4) için kümülatif Order
    Intake (K kolonu); başlıkta "{Yıl} Order Intake ⇒ {toplam}" (kullanıcının paylaştığı
    referans rapor grafiğinin sadeleştirilmiş karşılığı). Bir kaydın hangi çeyreğe düştüğü
    `Risk.gs` `computePlanQuarter_`'dan gelir (Status "Q#/YYYY" ise oradan, aksi halde Launch
    Sheet tarihinden). Yıl filtresi "Tümü"yse bu grafik yine de tek bir (varsayılan) yıl
    gösterir — 4 çeyrek yapısı gereği tek yıl zorunlu.
  - **4 grafik** (`chart-grid`, auto-fit): Plant (A) dağılımı (doughnut) · Project Type (B)
    bazında Hacim (yatay bar) · Project Type (B) bazında Order Intake (yatay bar) · Ürün (F)
    Bazlı Hacim (yatay bar). Her birine tıklamak üstteki genel arama kutusunu o değerle
    doldurup sayfayı yerinde yeniden süzer (`grafikler.md` "grafik = filtre kontrolü" —
    Liste'ye gitmez, Dashboard'un kendi üstünde filtreler).
  - **İki gruplu toplam tablosu**: Diameter (C) × Plant (A) bazında ve Project Type (B) ×
    Product (F) bazında K (OI) toplamı — orijinal `Calc_Data` QUERY pivotlarının (SELECT A,F,
    SUM(J) GROUP BY A,F) doğrudan karşılığı, artık istemci tarafında hesaplanıyor.
  - **Risk/Gecikme Tablosu** — yukarıdaki genel aramadan ayrı, kendi yerel arama kutusu var
    (yalnız bu tabloyu daha da daraltır, KPI/grafikleri etkilemez). P/N sütunu tıklanabilir
    buton, Detay Panelini açar.
- Eylemler: risk tablosundaki her satırda tek eylem — P/N'e tıkla → Detay Paneli
  (`docs/detay-panel.md`).
