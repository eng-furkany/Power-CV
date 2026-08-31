## Parça Listesi

- Header/Sol: Dashboard ekranıyla aynı kabuk (bkz. `layout-dashboard.md`).
- Ana alan (üstten alta):
  - **Filtre Barı** — `bilesenler.md` `.filter-bar` + `FilterDrop` (Plant, Product, Status
    çoklu seçim) + arama kutusu; altında aktif filtre chip'leri
    (`veri-listeleme.md` Aktif Filtre Chip'leri).
  - **Veri Tablosu** — `veri-listeleme.md` `ColFilter`-benzeri filtre/sıralama katmanı
    (küçük ölçek — 1000 satır altı — olduğu için parçalı çizim/`setTableHtmlChunked` bilerek
    ATLANDI, `mvp-akisi.md`'nin orantılı mühendislik ilkesi). Görünür kolonlar: Plant, P/N,
    Product, Volume, OI, Status, Launch. **P/N hücresi = tıklanabilir referans, Detay
    Panelini açar.**
  - ≤768px: tablo `mobileCards()` ile karta döner (`veri-listeleme.md` madde 4).
- Eylemler: sütun başlığı = sırala, filtre ikonu = `FilterDrop` aç, P/N = Detay Paneli.
- Detay Paneli (drawer, `docs/detay-panel.md`) bu ekranın üstüne sağdan açılır — ayrı bir
  Layout MD gerektirmiyor, davranışı `FSD.md`'de tarif edildi.
