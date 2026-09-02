# PRD — Power CV Launch Plan Dashboard

## Amaç

Europe/TMEAO bölgesi Power CV (ticari araç) parça lansman planını takip eden statik Google
Sheets tablosunu, canlı, çift yönlü çalışan bir web dashboard'a dönüştürmek. Bugün proje
durumu Sheets'te elle güncelleniyor ve genel görünüm için sabit bir "Dashboard" sekmesine
elle kopyalanıyor; bu araç genel durumu otomatik özetler ve tek bir yerden (hem okuma hem
yazma) yönetilmesini sağlar.

## Hedef Kullanıcı

Tek rol — Power CV lansman planına erişimi olan herkes hem görüntüler hem düzenler (Google
Sheets paylaşım izinleriyle aynı erişim çemberi; ayrı bir görüntüleyici/editör ayrımı bu
turda yok).

## Kapsam

**Bu turda var:**
- Sinoptik Dashboard ekranı — KPI özeti, durum dağılımı, ürün bazlı hacim grafiği, risk/gecikme
  tablosu.
- Parça Listesi ekranı — tüm parçalar, filtrelenebilir/sıralanabilir tablo, mobilde kart
  görünümü.
- **D kolonundaki referansa (P/N) tıklayınca** açılan düzenlenebilir Detay Paneli — tüm alanlar
  + 9 kilometre taşının durumu, önceki/sonraki kayıt gezinmesi.
- Google Sheets ile çift yönlü senkron: okuma anlık, yazma `google.script.run` ile doğrudan
  Sheet'e.
- Koyu mod, TR/EN dil desteği, mobil uyumluluk (bottom navigasyon) — varsayılan olarak kurulu
  (bkz. Standartlar `CLAUDE.md` 2026-08-29 kararı).
- Basit eşik-tabanlı risk rozeti (gecikmiş/geçmiş çeyrek, "Delay"/"Risk"/"On-hold" durumları).
- Günlük otomatik risk taraması (zamanlanmış tetikleyici) + kullanım özeti.

**2026-09 eklentisi — Wishlist ekranı:** aynı uygulamaya, ayrı bir Google Sheet'ten ("Live
Wishlist - Clutch CV AMEAO + Europe") beslenen üçüncü, salt-okunur bir sayfa eklendi — KPI
şeridi + 4 grafik + filtrelenebilir tam tablo + salt-okunur detay paneli (InfoModal deseni,
Detay Paneli'nden farklı, düzenleme yok). Kullanıcı bunu "aynı uygulamaya yeni bir sayfa"
olarak istedi (alternatif: ayrı bir Apps Script projesi — reddedildi). Detay: `TSD.md`
"Wishlist" bölümü, `docs/layout-wishlist.md`.

**Bu turda yok:**
- Çoklu rol/yetki ayrımı (görüntüleyici/editör) — tek rol yeterli görüldü, gerekirse
  `yetki-gorunumu.md` deseniyle sonraki turda eklenir.
- Yeni kayıt (parça) oluşturma formu — bu tur yalnız var olan kayıtları görüntüleme/düzenleme.
- Excel/PDF dışa aktarma, yazdırma düzeni — istenmedi, kapsam dışı bırakıldı.
- Bildirim merkezi, komut paleti (Ctrl+K), site haritası/favoriler — 2 ekranlık küçük bir
  araç için orantısız mühendislik olurdu (bkz. `mvp-akisi.md` "küçük ölçekte aşırı
  mühendislik yapılmaz" ilkesi).

## Veri Zemini

Google Sheets (kullanıcının "Power CV Launch Plan — Europe/TMEAO" tablosu, `Sheet1` sekmesi)
+ container-bound Apps Script web app. Script ID: `1tI6CtkAQ1aHD35k31vRC2EtWvto-HIcxYFR5cQzKG0OKRosy2Xtn8Ahq`
(kullanıcı tarafından zaten oluşturuldu). Veri modeli detayı: `TSD.md`.

## Başarı Kriteri

- Sheet'teki bir hücre değişikliği (elle) sayfa yeniden açıldığında dashboard'a yansır.
- Dashboard'dan yapılan bir düzenleme (Detay Panelinden) gerçek Sheet'e yazılır — Sheets'i
  açıp doğrulanabilir.
- D kolonundaki bir referansa tıklamak, o parçanın tüm bilgisini (9 kilometre taşı dahil)
  düzenlenebilir şekilde açar.
- Mobil bir cihazda (≤768px) tablo yatay taşma olmadan kart görünümüne döner, alt
  navigasyon çalışır.
- Koyu mod ve dil tercihi sayfa yenilendiğinde (aynı Google hesabında) hatırlanır.

## Kaynak Veri — Bilinen Sınırlamalar

İncelenen örnek dosyada Plant/Project Type/Product gibi alanlar maskelenmişti (gizlilik
amaçlı, gerçek proje adları değil) ve maskeleme tam tutarlı değildi (`Calc_Data`'da "Amiens"/
"Bursa" birkaç yerde maskelenmeden kalmıştı). Bu, yapı/kolon şemasını çıkarmak için
yeterliydi; gerçek veri Sheet ID üzerinden okunacak. G/H/I kolonları (`PPCA`/`Disc`/`RB`
başlıklı) yalnız o üç ürün tipi için dolu görünüyor — bunlar genel "Attribute 1/2/3" olarak
ele alındı, iş kuralı varsayılmadı (bkz. `TSD.md` "Bilinmeyen/Varsayılan Alanlar").
