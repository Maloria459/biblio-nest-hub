import eclatEncreImg from "@/assets/eclat-encre.png";

export const eclatEncreSrc = eclatEncreImg;

let promise: Promise<void> | null = null;
let preloadedImage: HTMLImageElement | null = null;

function ensurePreloadLink(href: string) {
  if (typeof document === "undefined") return;

  const existing = document.querySelector(
    `link[rel="preload"][as="image"][href="${href}"]`
  );
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = href;
  (link as HTMLLinkElement & { fetchPriority?: "high" | "low" | "auto" }).fetchPriority = "high";
  document.head.appendChild(link);
}

export function preloadAssets(): Promise<void> {
  if (promise) return promise;

  promise = new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    ensurePreloadLink(eclatEncreSrc);

    const img = new Image();
    preloadedImage = img; // keep decoded bitmap warm in memory

    const decodeThenDone = async () => {
      if (typeof img.decode === "function") {
        try {
          await img.decode();
        } catch {
          // Ignore decode errors and continue to avoid blocking UI
        }
      }
      done();
    };

    img.onload = () => {
      void decodeThenDone();
    };
    img.onerror = done;

    (img as HTMLImageElement & { fetchPriority?: "high" | "low" | "auto" }).fetchPriority = "high";
    img.decoding = "sync";
    img.src = eclatEncreSrc;

    if (img.complete && img.naturalWidth > 0) {
      void decodeThenDone();
    }
  });

  return promise;
}

export function usePreloadReady() {
  return promise ?? preloadAssets();
}


