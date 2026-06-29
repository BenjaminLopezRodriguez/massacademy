import Image from "next/image";

import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-5",
  md: "size-6",
  lg: "size-10",
  xl: "size-14",
} as const;

type LogoSize = keyof typeof sizes;

interface LogoProps {
  size?: LogoSize;
  priority?: boolean;
}

export function Logo({ size = "md", priority = false }: LogoProps) {
  const px = { sm: 20, md: 24, lg: 40, xl: 56 }[size];

  return (
    <Image
      src="/logo.svg"
      alt=""
      width={px}
      height={px}
      className={cn(sizes[size], "shrink-0")}
      priority={priority}
      aria-hidden
    />
  );
}
