import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import "@/styles.css";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider, useLanguage } from "@/hooks/use-language";
import { SeasonProvider } from "@/hooks/use-season";
import { AudioChantProvider } from "@/hooks/use-audio-chant";
import { SmoothScrollProvider } from "@/components/animation/SmoothScrollProvider";
import { Compass, Home, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  meta: () => [
    {
      charSet: "utf-8",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    },
    {
      title: "12 Jyotirlingam Darshan",
    },
    {
      name: "description",
      content:
        "Sacred portal for 12 Jyotirlingas darshan, live streams, devotional stotrams, chants, and stories.",
    },
  ],
  links: () => [
    {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      as: "font",
      type: "font/woff2",
      href: "/fonts/yatra-one-devanagari.woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      as: "style",
      href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Gujarati:wght@300;400;500;600;700&family=Noto+Sans+Tamil:wght@300;400;500;600;700&family=Noto+Sans+Telugu:wght@300;400;500;600;700&family=Noto+Serif+Devanagari:wght@400;500;600;700;800&family=Yatra+One&display=swap",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Gujarati:wght@300;400;500;600;700&family=Noto+Sans+Tamil:wght@300;400;500;600;700&family=Noto+Sans+Telugu:wght@300;400;500;600;700&family=Noto+Serif+Devanagari:wght@400;500;600;700;800&family=Yatra+One&display=swap",
    },
  ],
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
});

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  React.useEffect(() => {
    // If it's a dynamic module import failure (e.g. due to Vite dev server restart or network update),
    // automatically reload once to fetch the fresh bundle without crashing.
    if (
      typeof window !== "undefined" &&
      (error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("Importing a module script failed"))
    ) {
      const key = "darshan_chunk_reload_attempted";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-600 animate-pulse border border-amber-100">
        <RefreshCw className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold font-sans text-stone-900 tracking-tight mb-3">
        Sacred Darshan Portal Updating
      </h1>
      <p className="text-stone-600 max-w-md mb-8 leading-relaxed">
        The live darshan components have been refreshed. Please reconnect to continue your
        devotional journey.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("darshan_chunk_reload_attempted");
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect Darshan
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium px-6 py-3 rounded-lg shadow-sm transition-all"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  const { lang } = useLanguage();

  const strings = {
    en: {
      title: "Path Not Found",
      desc: "This sacred path does not exist. Seek the Darshan of Dwadash Jyotirlingam elsewhere.",
      btn: "Return to Home",
    },
    mr: {
      title: "मार्ग सापडला नाही",
      desc: "हा पवित्र मार्ग अस्तित्वात नाही. बारा ज्योतिर्लिंगांच्या दर्शनासाठी मुख्य पानावर जा.",
      btn: "मुख्य पानावर जा",
    },
    hi: {
      title: "मार्ग नहीं मिला",
      desc: "यह पवित्र मार्ग अस्तित्व में नहीं है। बारह ज्योतिर्लिंगों के दर्शन के लिए मुख्य पृष्ठ पर जाएं.",
      btn: "मुख्य पृष्ठ पर जाएं",
    },
  };

  const activeStrings = strings[lang] || strings.en;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-600 animate-pulse border border-amber-100">
        <Compass className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold font-sans text-stone-900 tracking-tight mb-3">
        {activeStrings.title}
      </h1>
      <p className="text-stone-600 max-w-md mb-8 leading-relaxed animate-fade-in">
        {activeStrings.desc}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-all hover:shadow-md"
      >
        <Home className="w-4 h-4" />
        {activeStrings.btn}
      </Link>
    </div>
  );
}

function RootComponent() {
  const context = Route.useRouteContext();

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('lang');if(l&&['en','mr','hi','gu','te','ta'].indexOf(l)>-1){document.documentElement.setAttribute('data-lang',l);document.documentElement.lang=l;}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <QueryClientProvider client={context.queryClient}>
          <AuthProvider>
            <LanguageProvider>
              <SeasonProvider>
                <AudioChantProvider>
                  <SmoothScrollProvider>
                    <div className="flex min-h-screen flex-col bg-background text-foreground">
                      <SiteHeader />
                      <main className="flex-1">
                        <Outlet />
                      </main>
                      <SiteFooter />
                    </div>
                  </SmoothScrollProvider>
                </AudioChantProvider>
              </SeasonProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
