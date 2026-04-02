/// <reference lib="dom" />
import { contextBridge, ipcRenderer } from 'electron';

// 1. Dış dünyaya sınırlı bir API sun
contextBridge.exposeInMainWorld('morrowInternals', {
  savePassword: (origin: string, user: string, pass: string) => ipcRenderer.send('password:save', origin, user, pass),
  getPasswords: (origin: string) => ipcRenderer.invoke('password:get', origin)
});

// 2. Sayfanın izole dünyasında (DOM) çalışacak olayları dinle
window.addEventListener('DOMContentLoaded', async () => {
    // A) Autofill mekanizması (Şifreleri ana süreçten çek ve alanlara yerleştir)
    try {
        const origin = window.location.origin;
        // Sadece HTTP/HTTPS sitelerinde çalış (about:blank vb. pas geç)
        if (!origin.startsWith('http')) return;

        const passwords = await ipcRenderer.invoke('password:get', origin);
        
        if (passwords && passwords.length > 0) {
            const credentials = passwords[0];
            
            // Password alanını bul
            const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');

            passwordInputs.forEach(passField => {
                 let form = passField.closest('form');
                 if (form) {
                    const textInputs = form.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="email"]');
                    if (textInputs.length > 0) {
                         const userField = textInputs[0];
                         // Değer yoksa doldur
                         if (!userField.value) {
                             userField.value = credentials.username;
                             userField.dispatchEvent(new Event('input', { bubbles: true }));
                             userField.dispatchEvent(new Event('change', { bubbles: true }));
                         }
                    }
                 }
                 if (!passField.value) {
                     passField.value = credentials.password; // decrypted by main process
                     passField.dispatchEvent(new Event('input', { bubbles: true }));
                     passField.dispatchEvent(new Event('change', { bubbles: true }));
                 }
            });
        }
    } catch (e) {
        // İletişim hatalarını sessizce yut
    }

    // B) Heuristic SPA (Instagram/Facebook) Form Gönderimi Yakalama
    let lastUsername = '';
    let lastPassword = '';
    let hasPrompted = false; // Aynı sayfa yüklenmesinde peş peşe sormaması için

    const updateCredentialsFromDOM = () => {
        const passwordFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
        if (passwordFields.length > 0) {
            // Şifre alanının doluluğunu kontrol et
            for (let p of Array.from(passwordFields)) {
                if (p.value) lastPassword = p.value;
            }

            // En yakın text / email field
            const textFields = document.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="email"], input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="button"])');
            if (textFields.length > 0) {
                 for (let i = textFields.length - 1; i >= 0; i--) {
                     if (textFields[i].value.trim() !== '') {
                         lastUsername = textFields[i].value.trim();
                         break;
                     }
                 }
            }
        }
    };

    const trySave = () => {
        if (!hasPrompted && lastPassword && window.location.origin.startsWith('http')) {
            hasPrompted = true;
            ipcRenderer.send('password:save', window.location.origin, lastUsername, lastPassword);
            // Sıfırla ki peş peşe tetiklenmesin ama farklı bir giriş olursa tetiklenebilsin diye 5 saniye sonra flag'i kaldır
            setTimeout(() => { hasPrompted = false; }, 5000);
        }
    };

    // Her tuş basıldığında hafızayı tazele
    document.addEventListener('input', updateCredentialsFromDOM, true);
    document.addEventListener('change', updateCredentialsFromDOM, true);

    // Tıklamaları dinle (Giriş Butonu vb.)
    document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('button, [type="submit"], [role="button"]');
        if (btn) {
            updateCredentialsFromDOM();
            if (lastPassword) {
                // Şifre girilmiş ve bir butona tıklanmışsa giriş yapılıyordur büyük muhtimal
                trySave();
            }
        }
    }, true);

    // Enter tuşunu dinle
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            updateCredentialsFromDOM();
            if (lastPassword) {
                trySave();
            }
        }
    }, true);

    // Zaten submit eden klasik siteler için (Google vb.)
    document.addEventListener('submit', (e: Event) => {
        updateCredentialsFromDOM();
        if (lastPassword) {
            trySave();
        }
    }, true);

    // C) Premium Mouse Gestures (Önceki sürümden temizlendi - Native Touchpad öncelikli)
});
