"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "sonner";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { FavoritesProvider } from "@/components/favorites/favorites-context";
import { PushPrompt } from "@/components/push/push-prompt";
import { MatchReminderWatcher } from "@/components/push/match-reminder-watcher";
import { InstallHint } from "@/components/pwa/install-hint";
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
        <FavoritesProvider>
          {children}
          <MatchReminderWatcher />
          <PushPrompt />
          <InstallHint />
          <Toaster
            theme="system"
            position="bottom-center"
            richColors
            closeButton
            toastOptions={{ className: "font-sans" }}
          />
        </FavoritesProvider>
      </DashboardProvider>
    </ThemeProvider>
  );
}
