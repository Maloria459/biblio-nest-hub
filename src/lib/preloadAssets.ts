import eclatEncreImg from "@/assets/eclat-encre.png";

let promise: Promise<void> | null = null;

export function preloadAssets(): Promise<void> {
  if (promise) return promise;

  promise = new Promise<void>((resolve) => {
    const img = new Image();
    const done = () => resolve();

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

    img.loading = "eager";
    (img as HTMLImageElement & { fetchPriority?: "high" | "low" | "auto" }).fetchPriority = "high";
    img.src = eclatEncreImg;

    if (img.complete && img.naturalWidth > 0) {
      void decodeThenDone();
    }
  });

  return promise;
}

export function usePreloadReady() {
  return promise ?? preloadAssets();
}

