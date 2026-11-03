import type { ReactNode } from "react";

export type BannerTone = "info" | "success" | "warning" | "danger";

type BannerProps = {
  tone: BannerTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  icon?: string;
};

const defaultIcons: Record<BannerTone, string> = {
  info: "ⓘ",
  success: "✓",
  warning: "!",
  danger: "×",
};

export function Banner({
  tone,
  title,
  children,
  action,
  compact = false,
  icon,
}: BannerProps) {
  return (
    <div
      className={`banner banner-${tone}${compact ? " banner-compact" : ""}`}
      role={tone === "danger" ? "alert" : "status"}
    >
      <span className="banner-icon" aria-hidden="true">
        {icon ?? defaultIcons[tone]}
      </span>
      <div className="banner-content">
        <strong>{title}</strong>
        {children ? <div className="banner-body">{children}</div> : null}
      </div>
      {action ? <div className="banner-action">{action}</div> : null}
    </div>
  );
}
