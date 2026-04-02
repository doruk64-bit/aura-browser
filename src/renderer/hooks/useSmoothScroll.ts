import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * useSmoothScroll — Lenis motorunu başlatan ve 
 * sayfalar arası akışkan kaydırma sağlayan kanca.
 */
export function useSmoothScroll() {
  useEffect(() => {
    // Lenis yapılandırması - Belirli bir wrapper'ı hedefle
    const lenis = new Lenis({
      wrapper: document.getElementById('main-content-scroll-root') || window,
      content: document.getElementById('main-content-scroll-content') || document.documentElement,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1, 
      touchMultiplier: 2,
      infinite: false,
    });

    // Her karede lenis.raf'ı çağır
    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    // Temizlik
    return () => {
      lenis.destroy();
    };
  }, []);
}
