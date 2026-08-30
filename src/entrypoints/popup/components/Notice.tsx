import type { PropsWithChildren } from "react";

export type NoticeProps = PropsWithChildren<{
  compact?: boolean;
  message: string;
  role?: "alert" | "status";
  title?: string;
  tone?: "default" | "error";
}>;

export function Notice({
  children,
  compact = false,
  message,
  role,
  title,
  tone = "default",
}: NoticeProps) {
  const classNames = [
    "notice",
    `notice--${tone}`,
    compact ? "notice--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classNames} role={role}>
      {title && <h2>{title}</h2>}
      <p>{message}</p>
      {children && <div className="notice-actions">{children}</div>}
    </section>
  );
}
