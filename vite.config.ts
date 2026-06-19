// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Outside the Lovable sandbox, the shared config only runs nitro (the engine
// that bundles the SSR server) when explicitly told to. On Vercel that meant
// `npm run build` was producing a client-only Vite build with no server
// output, which Vercel can't route — every page 404'd. Force nitro on with
// the `vercel` preset when building on Vercel so it emits a proper
// Build Output API v3 bundle (.vercel/output) with a working SSR function.
const isVercel = !!process.env.VERCEL;

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: isVercel
    ? {
        preset: "vercel",
        output: {
          dir: ".vercel/output",
          serverDir: ".vercel/output/functions/__server.func",
          publicDir: ".vercel/output/static",
        },
      }
    : undefined,
  vite: {
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      watch: {
        // The file watcher otherwise recursively walks these large dirs (the
        // bun install cache alone is hundreds of MB), exhausting file descriptors
        // (EMFILE) on dev startup. None of them contain app source.
        ignored: ["**/.cache/**", "**/.local/**", "**/dist/**", "**/.git/**"],
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
    },
  },
});
