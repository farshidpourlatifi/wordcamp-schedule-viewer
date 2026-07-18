import { createRoot } from "react-dom/client";

import { App } from "@/App";
import "@/styles/globals.css";

/**
 * Application entry point. Deliberately thin — it only mounts the tree, so
 * everything with real logic stays independently testable (and this file is
 * excluded from coverage in jest.config.js).
 */
createRoot(document.getElementById("root")).render(<App />);
