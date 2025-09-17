import { Injectable } from '@angular/core';


/**
 * DynamicFaviconService
 * Detects whether the browser natively animates GIF favicons (Firefox/Opera).
 * - If yes: inject a single <link rel="icon" href="animated-icon.gif"> and stop.
 * - If no: cycle through PNG frames (Evoku-0..Evoku-7) every 400ms.
 */
@Injectable({ providedIn: 'root' })
export default class DynamicFaviconService {
  private static readonly FRAME_INTERVAL_MS = 400;
  private static readonly FRAMES = Array.from({ length: 8 }, (_, i) => `/animation/Evoku-${i}.png`);
  private started = false;
  private timer: number | null = null;
  private frameIndex = 0;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    if (this.isGifFriendly()) {
      this.injectGif();
      return;
    }

    console.warn('Non-GIF-friendly browser detected, starting dynamic favicon animation.');

    // Non-GIF-friendly: start PNG cycling
    this.setFavicon(DynamicFaviconService.FRAMES[0]);
    this.timer = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      this.frameIndex = (this.frameIndex + 1) % DynamicFaviconService.FRAMES.length;
      this.setFavicon(DynamicFaviconService.FRAMES[this.frameIndex]);
    }, DynamicFaviconService.FRAME_INTERVAL_MS);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.setFavicon(DynamicFaviconService.FRAMES[this.frameIndex]);
      }
    });
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private isGifFriendly(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('firefox') || ua.includes('opera') || ua.includes('opr/');
  }

  private injectGif(): void {
    this.removeExisting();
    const link = document.createElement('link');
    link.id = 'dynamic-favicon';
    link.rel = 'icon';
    link.type = 'image/gif';
    link.href = '/animated-icon.gif';
    document.head.appendChild(link);
  }

  private setFavicon(href: string): void {
    let link = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
    if (!link) {
      this.removeExisting();
      link = document.createElement('link');
      link.id = 'dynamic-favicon';
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  private removeExisting(): void {
    // remove any pre-existing favicon links to ensure ours is authoritative
    document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());
  }
}
