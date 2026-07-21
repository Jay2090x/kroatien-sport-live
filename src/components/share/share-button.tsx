"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text?: string;
  /** Absolute or path; if relative, uses current origin */
  url: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon" | "icon-sm";
  label?: boolean;
}

function absoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${window.location.origin}${path}`;
}

export function ShareButton({
  title,
  text,
  url,
  className,
  variant = "outline",
  size = "sm",
  label = true,
}: ShareButtonProps) {
  const t = useTranslations("Share");
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const full = absoluteUrl(url);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: text || title, url: full });
        return;
      }
    } catch (e) {
      // user cancelled share sheet
      if (e instanceof Error && e.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("failed"));
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => void onShare()}
      className={cn(className)}
      aria-label={t("share")}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : typeof navigator !== "undefined" && "share" in navigator ? (
        <Share2 className="h-3.5 w-3.5" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      {label && (
        <span>{copied ? t("copiedShort") : t("share")}</span>
      )}
    </Button>
  );
}
