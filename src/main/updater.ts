/**
 * Auto Updater — Otomatik Güncelleme Yönetimi (Dal 5)
 *
 * Github Releases veya belirlenen bir sunucu üzerinden
 * tarayıcının yeni sürümlerini kontrol eder ve arka planda indirir.
 */

import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';

export function setupAutoUpdater(): void {
  // Geliştirme aşamasında otomatik güncellemeleri kapat (hata vermemesi için)
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  // Güncellemeleri arka planda indir
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Güncellemeler kontrol ediliyor...');
  });

  autoUpdater.on('update-available', (info: any) => {
    console.log('Güncelleme mevcut:', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Güncelleme bulunamadı. Sürümünüz güncel.');
  });

  autoUpdater.on('error', (err: any) => {
    console.error('Otomatik güncelleme hatası: ', err);
  });

  autoUpdater.on('update-downloaded', (info: any) => {
    dialog
      .showMessageBox({
        type: 'info',
        buttons: ['Yeniden Başlat', 'Daha Sonra'],
        title: 'Güncelleme Hazır',
        message: 'Morrow Browser için yeni bir güncelleme indirildi.',
        detail: `Sürüm ${info.version} kuruluma hazır. Uygulamayı yeniden başlatmak ister misiniz?`,
      })
      .then((returnValue) => {
        if (returnValue.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  // Kontrolü başlat (Uygulama açıldıktan 5 saniye sonra)
  setTimeout(() => {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
      console.error('Updater başlatılamadı:', e);
    }
  }, 5000);
}
