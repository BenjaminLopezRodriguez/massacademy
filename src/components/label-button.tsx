import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const labelButtonClassName = "label-button";

type LabelButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
} & ComponentPropsWithoutRef<"span">;

export function LabelButton({ children, className, href, ...props }: LabelButtonProps) {
  const classes = cn(labelButtonClassName, className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
