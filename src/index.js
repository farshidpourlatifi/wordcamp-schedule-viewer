import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import { App } from "@/App";
import { createQueryClient } from "@/lib/queryClient";
import "@/styles/globals.css";

/**
 * Application entry point. Deliberately thin — it only composes the root, so
 * everything with real logic stays independently testable (and this file is
 * excluded from coverage in jest.config.js).
 *
 * The QueryClient is created here rather than inside App: tests render App
 * with their own client (retries off, fresh cache per test), which a client
 * baked into the component would prevent.
 */
createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={createQueryClient()}>
    <App />
  </QueryClientProvider>,
);
