import eclatEncreImg from "@/assets/eclat-encre.png";

let promise: Promise<void> | null = null;

export function preloadAssets(): Promise<void> {
  if (promise) return promise;
  promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.src = eclatEncreImg;
    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }
    const done = () => resolve();
    if (typeof img.decode === "function") {
      img.decode().then(done, done);
    } else {
      img.onload = done;
      img.onerror = done;
    }
  });
  return promise;
}

export function usePreloadReady() {
  return promise ?? preloadAssets();
}
