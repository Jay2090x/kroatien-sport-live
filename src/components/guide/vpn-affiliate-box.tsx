"use client";

import { useTranslations } from "next-intl";
import { Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VPN_PROVIDERS } from "@/lib/constants";

const AFFILIATE =
  process.env.NEXT_PUBLIC_VPN_AFFILIATE_URL ||
  VPN_PROVIDERS[0]?.url ||
  "https://nordvpn.com";

/**
 * Unaufdringliche Geo-Block / VPN Affiliate Box
 */
export function VpnAffiliateBox({
  streamName,
  className,
}: {
  streamName?: string;
  className?: string;
}) {
  const t = useTranslations("Guide");

  return (
    <div
      className={
        className ||
        "mt-2 rounded-xl border border-croatia-blue/30 bg-gradient-to-r from-[color-mix(in_oklab,var(--croatia-blue)_18%,transparent)] to-card px-3 py-2.5"
      }
    >
      <div className="flex gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sky-300">
          <Lock className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-snug text-foreground/90">
            {t("vpnMessage", {
              stream: streamName || t("vpnStreamFallback"),
            })}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-2 h-8 bg-[#171796] text-xs font-semibold text-white hover:bg-[#1e22b0]"
            onClick={() => {
              window.open(AFFILIATE, "_blank", "noopener,noreferrer");
            }}
          >
            {t("vpnCta")}
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
