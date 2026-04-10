import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router";
import Router from "./Router/Router.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeProvider.tsx";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "./context/AuthContext.tsx";
import ScrollToTopOnReload from "./components/common/ScrollToTopOnReload.tsx";
import { ProfileDrawerProvider } from "./context/ProfileDrawerContext.tsx";
import ProfileDrawer from "./components/Navbar/ProfileDrawer.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <div className="bangla">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ProfileDrawerProvider>
                <ProfileDrawer />
                <Router />
                <ScrollToTopOnReload />
                <Toaster position="top-right" />
                <SpeedInsights />
              </ProfileDrawerProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </div>
    </BrowserRouter>
  </StrictMode>,
);
