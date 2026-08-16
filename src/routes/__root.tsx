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
import { Compass, Home } from "lucide-react";
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
      title: "Dwadash Jyotirlingam",
    },
  ],
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

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
      </head>
      <body suppressHydrationWarning>
        <QueryClientProvider client={context.queryClient}>
          <AuthProvider>
            <LanguageProvider>
              <SeasonProvider>
                <AudioChantProvider>
                  <div className="flex min-h-screen flex-col bg-background text-foreground">
                    <SiteHeader />
                    <main className="flex-1">
                      <Outlet />
                    </main>
                    <SiteFooter />
                  </div>
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
