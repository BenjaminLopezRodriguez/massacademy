import type { ReactNode } from "react";

import { LabelButton } from "@/components/label-button";

export function FeedChip({
  label,
  href,
  children,
}: {
  label: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <LabelButton href={href}>
      <span className="label text-ink-faint">{label}</span>
      <span>{children}</span>
    </LabelButton>
  );
}
