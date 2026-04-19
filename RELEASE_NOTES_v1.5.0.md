# 🚀 Morrow Browser v1.5.0 - The "Vault" Update

Bu sürümle birlikte Morrow Browser'ın tasarım dilini bir üst seviyeye taşıyor ve en çok geri bildirim aldığımız eklenti yönetimini baştan aşağı yeniliyoruz! 💎🛡️

## ✨ Yenilikler (What's New)

### 🧩 Premium "Uzantılar Kasası" (Extensions Vault)
Eklenti yönetimi artık her zamankinden daha şık ve kullanışlı! Hem **Yan Panel (Sidebar)** hem de **Tepe Menü (TopBar Popup)** için "Kasa" tasarım sistemine geçiş yaptık.
*   **Glassmorphism Card Design**: Şeffaf, gradyanlı ve premium kart yapısı.
*   **Akıllı İkon Sistemi**: Eklenti ikonları artık ana işlemden (Base64) çekilerek her koşulda kusursuz görüntüleniyor.
*   **Entegre Arama (Search)**: Eklentileriniz arasında anında filtreleme yapabileceğiniz hızlı arama motoru eklendi.

### 📐 Dinamik Sidebar Düzeni (Flexbox Layout)
Yan panel artık site içeriğinin üzerine binmiyor!
*   Panel açıldığında site içeriği fiziksel olarak sağa kayar, böylece hem siteyi hem de paneli aynı anda kesintisiz görebilirsiniz.

## 🛠️ İyileştirmeler ve Hata Düzeltmeleri (Fixes & Improvements)

*   **Startup Stability**: macOS üzerinde yaşanan siyah ekran ve başlangıç çökme sorunları giderildi.
*   **GPU Acceleration**: Donanım hızlandırma ayarları Mac için optimize edildi, daha akıcı bir tarama deneyimi sağlandı.
*   **Syntax & Build Fixes**: Projenin derlenmesini engelleyen inatçı TSC hataları (TS1005) tamamen temizlendi.
*   **Base64 Icon Extraction**: `chrome-extension://` protokol kısıtlamaları, ikonların diskten okunup arayüze doğrudan aktarılmasıyla (Base64) kalıcı olarak çözüldü.

---

### 📦 Kurulum (Installation)
Geliştirici modunda denemek için:
1. `git pull origin main`
2. `npm install`
3. `npm run dev`

---

> **Morrow AI Ekibi:** Tarayıcınızı her gün daha güçlü ve zarif hale getirmek için çalışıyoruz. Keyifli gezintiler! 🚀🔥
