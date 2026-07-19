"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "sonner";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import type { Match, Player } from "@/types";

interface AppProvidersProps {
  children: React.ReactNode;
  initialMatches: Match[];
  initialPlayers: Player[];
  lastUpdated: string;
  dataSource: string;
  dataErrors?: string[];
}

export function AppProviders({
  children,
  initialMatches,
  initialPlayers,
  lastUpdated,
  dataSource,
  dataErrors,
}: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <DashboardProvider
        initialMatches={initialMatches}
        initialPlayers={initialPlayers}
        lastUpdated={lastUpdated}
        dataSource={dataSource}
        dataErrors={dataErrors}
      >
        {children}
        <Toaster
          theme="system"
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{ className: "font-sans" }}
        />
      </DashboardProvider>
    </ThemeProvider>
  );
}
