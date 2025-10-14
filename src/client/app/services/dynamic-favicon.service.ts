import { Injectable } from '@angular/core';


/**
 * DynamicFaviconService
 * Detects whether the browser supports SVG favicons
 * - If no: inject a single static favicon link and stop
 * - If yes: Load svg and modify the colors every 400ms to create an animation effect
 */
@Injectable({ providedIn: 'root' })
export default class DynamicFaviconService {
  private static readonly FRAME_INTERVAL_MS = 400;
  private static readonly SEQUENCE = [0, 1, 2, 4, 7, 6, 5, 3];
  private static readonly OPPOSITE_MAX_INDEX = 7;
  private static readonly IOS_VERSION_REGEX = /os\s+(\d+)[._](\d+)/;
  private initialSvg: string | null;
  private cachedSvg: string | null;

  private timer: number | null;
  private frameIndex: number;
  private domParser: DOMParser;
  private xmlSerializer: XMLSerializer;

  constructor() {
    this.timer = null;
    this.frameIndex = 0;
    this.domParser = new DOMParser();
    this.xmlSerializer = new XMLSerializer();
    this.initialSvg = null;
    this.cachedSvg = null;
    this.start();
  }

  private onVisibilityChange = (): void => {
    this.updateIcon();
  }

  public start(): void {
    if (this.isSVGUnfriendly()) {
      console.warn('Non-SVG-friendly browser detected, injecting static favicon.');
      this.setStaticIcon();
      return;
    }

    // SVG-friendly: start SVG animation cycling (ensure SVG is fetched first)
    void this.ensureSvgFetched().then(() => {
      this.updateIcon();
      this.timer = window.setInterval(() => {
        if (document.hidden) {
          return;
        }
        this.frameIndex = (this.frameIndex + 1) % DynamicFaviconService.SEQUENCE.length;
        this.updateIcon();
      }, DynamicFaviconService.FRAME_INTERVAL_MS);
    }).catch(err => {
      console.warn('Failed to fetch icon.svg, falling back to static icon.', err);
      this.setStaticIcon();
    });

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  public stop(): void {
    console.log('[ngOnDestroy] Stopping dynamic favicon service.');
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    // Reset animation state so a subsequent start() begins from a clean slate
    this.frameIndex = 0;
    if (this.initialSvg) {
      this.cachedSvg = this.initialSvg;
      try {
        const dataUri = `data:image/svg+xml;base64,${btoa(this.initialSvg)}`;
        this.setSVGIcon(dataUri);
      } catch {
        // ignore btoa issues in odd environments and leave favicon as-is
      }
    }
  }

  private updateIcon(): void {
    // Parse the SVG string into a manipulable XML Document
    const svgSource = this.cachedSvg ?? '';
    if (!svgSource) {
      return; // nothing to do
    }
    const svgDoc = this.domParser.parseFromString(svgSource, 'image/svg+xml');
    const svgRoot = svgDoc.documentElement;

    // Get the ID of the element to flip for the current frame
    const elementToFlip = DynamicFaviconService.SEQUENCE[this.frameIndex];

    [elementToFlip, DynamicFaviconService.OPPOSITE_MAX_INDEX - elementToFlip].forEach(elementId => {
      const element = svgRoot.querySelector(`[id="p${elementId}"]`);
      if (element) {
        // Invert the fill and stroke colors
        const currentFill = element.getAttribute('fill');
        const currentStroke = element.getAttribute('stroke');
        element.setAttribute('fill', currentStroke || '');
        element.setAttribute('stroke', currentFill || '');
      }
    });

    // Serialize the modified SVG back to a string
    const svgString = this.xmlSerializer.serializeToString(svgRoot);

    // Create a data URI and set it as the favicon
    try {
      const dataUri = `data:image/svg+xml;base64,${btoa(svgString)}`;
      this.setSVGIcon(dataUri);
    } catch (err) {
      console.warn('Failed to base64-encode SVG frame, stopping animation.', err);
      this.stop();
      return;
    }

    // Persist the modified SVG so future frames build on the new state
    this.cachedSvg = svgString;
  }

  private async ensureSvgFetched(): Promise<void> {
    if (this.cachedSvg) {
      return;
    }
    const res = await fetch('/icon.svg');
    if (!res.ok) {
      throw new Error('Failed to fetch /icon.svg');
    }
    this.cachedSvg = await res.text();
    // keep a copy of the original SVG so we can reset after stopping the animation
    if (!this.initialSvg) {
      this.initialSvg = this.cachedSvg;
    }
  }

  private isSVGUnfriendly(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    const ua = navigator.userAgent.toLowerCase();

    // Only care about iOS devices
    if (!/(iphone|ipad|ipod)/.test(ua)) {
      return false;
    }

    // Ensure this is Safari (exclude common iOS browsers like Chrome/Firefox/Edge)
    if (!/safari/.test(ua) || /crios|fxios|edgios|opr\//.test(ua)) {
      return false;
    }

    // Match iOS version like "OS 18_5" or "OS 18_6_1"
    const match = ua.match(DynamicFaviconService.IOS_VERSION_REGEX);
    if (!match) {
      return false;
    }

    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);

    if (Number.isNaN(major) || Number.isNaN(minor)) {
      return false;
    }

    // Safari on iOS before 18.6 is considered SVG-unfriendly
    if (major < 18) {
      return true;
    }
    if (major === 18 && minor < 6) {
      return true;
    }

    return false;
  }

  private setStaticIcon(): void {
    this.removeExisting();
    const link = document.createElement('link');
    link.id = 'dynamic-favicon';
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = '/favicon.ico';
    document.head.appendChild(link);
  }

  private setSVGIcon(href: string): void {
    let link = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
    if (!link) {
      this.removeExisting();
      link = document.createElement('link');
      link.id = 'dynamic-favicon';
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  private removeExisting(): void {
    // remove any pre-existing favicon links to ensure ours is authoritative
    document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());
  }
}
