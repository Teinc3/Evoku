import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root',
})
export default class SvgPrecacheService {
  private started: boolean;
  private preloadedImages: Map<string, HTMLImageElement>;
  private preloadPromises: Map<string, Promise<void>>;

  constructor() {
    this.started = false;
    this.preloadedImages = new Map<string, HTMLImageElement>();
    this.preloadPromises = new Map<string, Promise<void>>();
  }

  public schedule(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => {
        void this.precacheAllSvgs();
      }, { timeout: 250 });
      return;
    }

    setTimeout(() => {
      void this.precacheAllSvgs();
    }, 250);
  }

  private async precacheAllSvgs(): Promise<void> {
    const manifest = await this.loadManifest();
    if (!manifest) {
      return;
    }

    const maxConcurrency = 4;
    let nextIndex = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const url = manifest[nextIndex];
        nextIndex++;

        if (!url) {
          return;
        }

        try {
          await this.preloadImage(url);
        } catch {
          // Ignore individual failures; can be loaded in the future, if cache fails
        }
      }
    };

    await Promise.all(Array.from({ length: maxConcurrency }, () => worker()));
  }

  private async loadManifest(): Promise<readonly string[] | null> {
    try {
      const response = await fetch('/assets/svg-manifest.json', { cache: 'no-cache' });
      if (!response.ok) {
        return null;
      }
      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        return null;
      }

      return data.filter((entry): entry is string => {
        return typeof entry === 'string' && entry.length > 0;
      });
    } catch {
      return null;
    }
  }

  private preloadImage(url: string): Promise<void> {
    const existingPromise = this.preloadPromises.get(url);
    if (existingPromise) {
      return existingPromise;
    }

    if (this.preloadedImages.get(url)?.complete) {
      return Promise.resolve();
    }

    const img = new Image();
    this.preloadedImages.set(url, img);

    const promise = new Promise<void>(resolve => {
      img.onload = img.onerror = () => {
        resolve();
      };
    });

    img.src = url;
    this.preloadPromises.set(url, promise);
    return promise;
  }
}
