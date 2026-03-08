import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadAssets } from "./lib/preloadAssets";

// Start preloading assets immediately, before React renders
preloadAssets();

createRoot(document.getElementById("root")!).render(<App />);
