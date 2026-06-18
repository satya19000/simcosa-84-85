import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { WelcomeToast } from "@/components/WelcomeToast";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4">Page not found</h2>
        <p className="mt-2 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex items-center rounded-md bg-primary px-5 py-3 text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h2>Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-primary-foreground">Go home</a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SIMCOSA 84–85 Batch Portal" },
      { name: "description", content: "Private alumni portal for the SIMCOSA 1984–85 batch — reunions, memories, and member support." },
      { property: "og:title", content: "SIMCOSA 84–85 Batch Portal" },
      { name: "twitter:title", content: "SIMCOSA 84–85 Batch Portal" },
      { property: "og:description", content: "Private alumni portal for the SIMCOSA 1984–85 batch — reunions, memories, and member support." },
      { name: "twitter:description", content: "Private alumni portal for the SIMCOSA 1984–85 batch — reunions, memories, and member support." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <Toaster richColors position="top-center" />
        <WelcomeToast />
      </AuthProvider>
    </QueryClientProvider>
  );
}
