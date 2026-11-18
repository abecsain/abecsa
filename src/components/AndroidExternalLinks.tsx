"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    AndroidBridge?: {
      openUrl: (url: string) => void;
      shareText?: (text: string) => void;
    };
  }
}

export default function AndroidExternalLinks() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Intercept window.open calls
    const originalOpen = window.open ? window.open.bind(window) : null;

    window.open = function (url?: string | URL, target?: string, features?: string) {
      const urlStr = url ? url.toString() : "";

      if (
        window.AndroidBridge &&
        urlStr &&
        (urlStr.startsWith("whatsapp://") ||
          urlStr.startsWith("https://wa.me") ||
          urlStr.startsWith("https://api.whatsapp.com") ||
          urlStr.startsWith("tel:") ||
          urlStr.startsWith("upi://") ||
          urlStr.startsWith("mailto:"))
      ) {
        window.AndroidBridge.openUrl(urlStr);
        return null;
      }

      if (originalOpen) {
        return originalOpen(url, target, features);
      }
      return null;
    };

    // 2. Intercept anchor clicks on external protocols
    const handleAnchorClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      const anchor = target as HTMLAnchorElement | null;
      if (!anchor?.href) return;

      const href = anchor.href;
      const isExternalAction =
        href.includes("wa.me") ||
        href.startsWith("whatsapp://") ||
        href.startsWith("tel:") ||
        href.startsWith("upi://") ||
        href.startsWith("mailto:");

      if (isExternalAction && window.AndroidBridge) {
        e.preventDefault();
        e.stopPropagation();
        window.AndroidBridge.openUrl(href);
      }
    };

    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      if (originalOpen) {
        window.open = originalOpen;
      }
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, []);

  return null;
}
