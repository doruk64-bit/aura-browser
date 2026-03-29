# Morrow Browser V1.4.1 - Automated Background Update System
Bu sürümle birlikte Morrow Browser, manuel güncelleme zahmetini tamamen ortadan kaldırarak sektör standartlarında bir "Tek Tıkla Otomatik Güncelleme" deneyimine kavuştu.

### Yeni Özellikler & Değişiklikler
- **Tam Otomatik Arka Plan İndirme**: Yeni bir sürüm yayınlandığında, GitHub sayfasına gitmenize gerek kalmadan tarayıcı içinden indirme başlatılır.
- **Sessiz Kurulum (Silent Install)**: Windows kullanıcıları için indirme biter bitmez kurulum arka planda (`/S` moduyla) sessizce başlar ve Morrow kendini otomatik yeniler.
- **Canlı İlerleme Göstergesi (TopBar Update Bar)**: İndirme işlemi başladığında üst çubuğun (TopBar) hemen altında şık, Morrow pembesi bir ilerleme çubuğu ve yüzde göstergesi belirir.
- **Akıllı Varlık Keşfi (Smarter Asset Discovery)**: GitHub API üzerinden platformunuza en uygun yükleme dosyasını (.exe veya .dmg) otomatik olarak saptayan gelişmiş bir eşleşme mantığı devreye alındı.
- **Robust Hata Yönetimi**: Windows dosya sistemi kilitleme (EBUSY) ve API erişim sorunlarına (Rate Limit/404) karşı dayanıklı bir altyapı kuruldu.

### Hata Düzeltmeleri
- **Update Redirection Fix**: Güncelleme butonuna basıldığında dosya bulunamayıp GitHub'a fırlatma sorunu giderildi; artık indirme doğrudan tarayıcı içinde başlıyor.
- **Dosya Kilidi (EBUSY)**: İndirilen dosyanın henüz kapanmadan çalıştırılmaya çalışılması sonucu oluşan çakışma giderildi.

---

# Morrow Browser V1.4.0 - Network Limiter & Mac UI Update
Bu sürümde ağ sınırlayıcı sistemi tamamen yenilenerek yerleşik Electron oturum emülasyonuna geçilmiş ve macOS kullanıcıları için arayüz yerleşimi optimize edilmiştir.

### Yeni Özellikler & Değişiklikler
- **Native Ağ Sınırlayıcı (Network Emulation)**: Önceki sürümlerdeki kararsız debugger tabanlı sınırlayıcı yerine, Electron'un yerleşik `session.enableNetworkEmulation` API'sine geçildi. Bu sayede tüm sekmeler, servis çalışanları ve arka plan verileri %100 istikrarla belirlenen hızda (örn: 1 Mbps) sınırlandırılır.
- **Düşük Gecikme (Latency) Ayarı**: Limitleyici aktifken oluşan aşırı gecikme süresi 100ms'den 20ms'ye düşürülerek daha akıcı bir gezinme deneyimi sağlandı.
- **macOS Arayüz Uyumu (TopBar)**: Mac'teki sol üst sistem butonlarıyla (trafik ışıkları) çakışmayı önlemek için "Morrow Browser" logosu ve başlığı sağ üst köşeye taşındı.
- **Performans Paneli Düzeltmesi**: Ağ sınırlayıcısı kapalıyken gösterge tablosunda görünen hatalı düşük hız verileri düzeltildi; artık gerçek yüksek bant genişliği değerleri simüle ediliyor.
- **Otomatik Sürüm Yayınlama**: GitHub Actions üzerinden otomatik sürüm (Release) oluşturma ve paketleme sistemi devreye alındı.

### Hata Düzeltmeleri
- **Network Speed Limit Persistence**: Uygulama her açıldığında ağ sınırının tüm oturumlara (standart, gizli ve varsayılan) doğru şekilde uygulanması sağlandı.
- **UI Metrikleri**: Performans panelindeki ağ hızı göstergeleri daha gerçekçi ve tepkisel hale getirildi.

---

# Morrow Browser V1.3.6 - AI & Productivity Update
Bu sürümde tarayıcıya gerçek bir AI (Puter.js) entegrasyonu, PiP desteği, gelişmiş tam ekran modu ve verimliliği artıran hızlı not defteri özellikleri eklenmiştir.

### Yeni Özellikler & Değişiklikler
- **Gelişmiş AI Entegrasyonu (Puter.js v2)**: Adres çubuğundaki AI butonu aktif edildi. Puter.js v2 ile streaming (canlı yazım), misafir modu (giriş gerektirmez) ve tarayıcı ayarlarını AI ile kontrol etme özellikleri eklendi.
- **Sayfa Analizi & Özetleme**: AI artık aktif sekmedeki içeriği analiz edip sizin için özet çıkarabilir.
- **Hızlı Not Defteri (Sidebar)**: Yan panelde notlarınızı alabileceğiniz, yerel depolamada saklanan şık bir not defteri eklendi.
- **Resim İçinde Resim (PiP)**: Videolara sağ tıklayarak veya Omnibox'taki ikona tıklayarak videoları küçük bir pencerede oynatabilirsiniz.
- **Tam Ekran Düzeltmesi**: Video tam ekranına geçildiğinde üst bar ve yan bar otomatik olarak gizlenerek kesintisiz bir deneyim sunar.

### Hata Düzeltmeleri
- **AI Streaming Fix**: Puter.js v2 verilerinin stream sırasında düzgün görünüp komutların (arka planda sessizce) çalışması sağlandı.
- **Puter.js Black Screen**: CSP ayarları güncellenerek Puter.js yüklenirken tarayıcının siyah ekranda kalma sorunu giderildi.

---

# Morrow Browser V1.3.5 - Omnibox & AdBlock Fixes
Bu sürümde arama çubuğuna entegrasyonlar sağlanmış ve tarayıcının çekirdek özelliklerindeki bazı ufak pürüzler giderilmiştir. Ayrıca genel arama önerileri optimizasyonları ve iç ayarlar performans geliştirmeleri uygulandı.

### Yeni Özellikler & Değişiklikler
- **Arama Çubuğu (Omnibox) Geçmiş Entegrasyonu**: Artık adres çubuğundan doğrudan kendi arama geçmişinizi anında tarayabilirsiniz. Bulunan geçmiş sonuçları `🕒` (saat) ikonuyla gösterilir ve eş zamanlı olarak web'den gelen sonuçlarla harmanlanır.

### Hata Düzeltmeleri
- **Ayarlar Ekranında Z-Index Hatası**: `/settings` (Ayarlar) sayfası açıldığında arka plandaki sekmelerin arayüzü örtmesi hatası `TabManager` optimizasyonlarıyla düzeltildi.
- **Kategorik Adblock Engeli**: Sekme oluşturulma Partition'ları düzeltilerek webRequest eklentilerinin (Adblock v.b) her sekmede %100 istikrarla çalışması güvence altına alındı.
- **Geçmiş (History)**: Sayfalar arası dolaşımın veritabanına işlenmemesi durumu TabManager IPC kanalları kullanılarak onarıldı. Artık verileriniz başarıyla tutuluyor.

---

# Morrow Browser V1.3.4 - Rebranding & Tab Grouping Release

Bu sürümde uygulama ismi **Morrow Browser** olarak güncellendi ve sekme düzeninde köklü görsel/mantıksal iyileştirmeler yapıldı.

### Yeni Özellikler & Değişiklikler
- **Yeniden Markalama**: "Aura" ibareleri ve protokoller (`morrow://`) tamamen güncellendi.
- **Sağ Tık ile Gruplama**: Bir sekmeye sağ tıklayıp **"Sağdaki ile Grupla"** diyerek anında dinamik grup oluşturabilirsiniz.
- **Grup Görseli**: Gruplanan sekmeler küçülür ve grup sınırlarına görsel derinlik katmak adına boşluk (`12px`) ayrılır.
- **Oto-Güncelleme Sistemi**: v1.3.3'teki `version_id` ve `version.json` tabanlı özel oto-güncelleme uyarı sistemi geri getirildi.

### Hata Düzeltmeleri
- **Main Process Crash**: Çoklu veya seri x (kapatma) tetiklemelerindeki `Object has been destroyed` kilitlenmesi giderildi.

---
*Morrow Browser ile daha temiz ve hızlı bir web deneyimi sizi bekliyor!*
