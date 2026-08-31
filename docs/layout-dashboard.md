## Dashboard (Sinoptik Görünüm)

- Header: sabit yükseklik, `tokens/colors.css --valeo-blue` zemin, sol logo + "Power CV Launch
  Plan" başlığı, sağ koyu-mod/dil düğmeleri (bkz. `baslarken.md` #3).
- Sol: statik ikon-sidebar (Dashboard aktif) — masaüstü/tablet; ≤768px'te bottom-nav
  (`sidebar.md` "Adaptif Navigasyon Katmanları").
- Ana alan (üstten alta):
  - **Genel Arama** — sayfanın en üstünde, virgülle ayrılmış çoklu terim kabul eden tek bir
    arama kutusu (P/N, Plant, Product, Project Type, Status üzerinde OR eşleşme, Türkçe
    karakter-duyarsız). Aşağıdaki KPI/grafik/gruplu-tablo/risk-tablosu bölümlerinin TAMAMI bu
    aramaya göre önceden süzülür — sayfa canlı bir filtrelenmiş görünüme dönüşür.
  - **KPI şeridi** — 5 `.kpi-card` (Toplam Parça, Toplam Hacim, Toplam EUR, Launched,
    Risk/Gecikme) — `jenerik-desenler.md` Kart/KPI Kartı.
  - **4 grafik** (`chart-grid`, auto-fit): Plant (A) dağılımı, Project Type (B) dağılımı,
    Status (M) dağılımı — üçü de doughnut — ve Ürün (F) Bazlı Hacim (yatay bar). Her birine
    tıklamak üstteki genel arama kutusunu o değerle doldurup sayfayı yerinde yeniden süzer
    (`grafikler.md` "grafik = filtre kontrolü" — Liste'ye gitmez, Dashboard'un kendi üstünde
    filtreler).
  - **İki gruplu toplam tablosu**: Diameter (C) × Plant (A) bazında ve Project Type (B) ×
    Product (F) bazında K (OI) toplamı — orijinal `Calc_Data` QUERY pivotlarının (SELECT A,F,
    SUM(J) GROUP BY A,F) doğrudan karşılığı, artık istemci tarafında hesaplanıyor.
  - **Risk/Gecikme Tablosu** — yukarıdaki genel aramadan ayrı, kendi yerel arama kutusu var
    (yalnız bu tabloyu daha da daraltır, KPI/grafikleri etkilemez). P/N sütunu tıklanabilir
    buton, Detay Panelini açar.
- Eylemler: risk tablosundaki her satırda tek eylem — P/N'e tıkla → Detay Paneli
  (`docs/detay-panel.md`).
