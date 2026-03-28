import { WebContents } from 'electron';

export type OptimizationMode = 'balanced' | 'turbo' | 'powersave' | 'video' | 'productivity' | 'light';

export class SiteOptimizer {
  private static instance: SiteOptimizer;
  
  private constructor() {}

  public static getInstance(): SiteOptimizer {
    if (!SiteOptimizer.instance) {
      SiteOptimizer.instance = new SiteOptimizer();
    }
    return SiteOptimizer.instance;
  }

  /**
   * Sekmenin URL'sine göre en uygun optimizasyon profilini belirler
   */
  public getOptimizationMode(url: string): OptimizationMode {
    try {
      if (!url || url === 'about:blank') return 'balanced';
      
      const hostname = new URL(url).hostname.toLowerCase();

      // 1. Video Profili (YouTube, Twitch, Netflix vb.)
      if (hostname.includes('youtube.com') || 
          hostname.includes('twitch.tv') || 
          hostname.includes('netflix.com') ||
          hostname.includes('disneyplus.com') ||
          hostname.includes('primevideo.com')) {
        return 'video';
      }

      // 2. Üretkenlik/Ağır Uygulama Profili (Figma, Discord, Slack, Canva vb.)
      if (hostname.includes('figma.com') || 
          hostname.includes('discord.com') || 
          hostname.includes('slack.com') ||
          hostname.includes('canva.com') ||
          hostname.includes('github.com') ||
          hostname.includes('epicgames.com') ||
          hostname.includes('steampowered.com')) {
        return 'productivity';
      }

      // 3. Hafif/Metin Profili (Haber siteleri, Bloglar, Wikipedia)
      if (hostname.includes('wikipedia.org') || 
          hostname.includes('medium.com') || 
          hostname.includes('reddit.com') ||
          hostname.includes('twitter.com') ||
          hostname.includes('x.com')) {
        return 'light';
      }

      return 'balanced';
    } catch {
      return 'balanced';
    }
  }

  /**
   * Belirli bir WebContents'e optimizasyon profilini uygular
   */
  public applyProfile(wc: WebContents, mode: OptimizationMode): void {
    if (wc.isDestroyed()) return;

    switch (mode) {
      case 'video':
        // GPU Hızlandırmalı Video ve Yüksek Network Buffer
        wc.setAudioMuted(false);
        // DevTools Protocol ile Frame Throttling kaldırılabilir
        wc.setBackgroundThrottling(false);
        break;

      case 'productivity':
        // Yüksek öncelikli JS execution
        wc.setBackgroundThrottling(false);
        break;

      case 'light':
        // Güç tasarrufu ve agresif throttle
        wc.setBackgroundThrottling(true);
        break;

      case 'powersave':
        wc.setBackgroundThrottling(true);
        break;

      case 'turbo':
        wc.setBackgroundThrottling(false);
        break;

      default:
        // Varsayılan olarak aşırı kısıtlama yapmıyoruz (Performans için)
        wc.setBackgroundThrottling(false);
        break;
    }
  }
}
