## Dashboard (Sinoptik Görünüm)

- Header: sabit yükseklik, `tokens/colors.css --valeo-blue` zemin, sol logo + "Power CV Launch
  Plan" başlığı, sağ koyu-mod/dil düğmeleri (bkz. `baslarken.md` #3).
- Sol: statik ikon-sidebar (Dashboard aktif) — masaüstü/tablet; ≤768px'te bottom-nav
  (`sidebar.md` "Adaptif Navigasyon Katmanları").
- Ana alan (üstten alta):
  - **KPI şeridi** — 5 `.kpi-card` (Toplam Parça, Toplam Hacim, Toplam EUR, Launched,
    Risk/Gecikme) — `jenerik-desenler.md` Kart/KPI Kartı.
  - **Grafik satırı** (2 kolon, geniş ekranda yan yana / dar ekranda alt alta):
    - Durum Dağılımı — doughnut (`grafikler.md` Halka Grafik Deseni, tıklanınca Liste'ye filtre
      geçer).
    - Ürün Bazlı Hacim — yatay bar (`grafikler.md` Çubuk Grafik Deseni).
  - **Risk/Gecikme Tablosu** — `veri-listeleme.md`'nin tablo görsel kurallarıyla (satır/header
    yüksekliği, sayı hizalama) ama filtre barı yok (sinoptik ekran salt-okunur); P/N sütunu
    tıklanabilir buton, Detay Panelini açar.
- Eylemler: risk tablosundaki her satırda tek eylem — P/N'e tıkla → Detay Paneli
  (`docs/detay-panel.md`).
