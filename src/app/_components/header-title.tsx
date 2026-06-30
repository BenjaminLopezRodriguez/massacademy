"use client";

import { usePathname } from "next/navigation";

const SECTION_LABELS: { prefix: string; label: string }[] = [
  { prefix: "/feed", label: "Feed" },
  { prefix: "/problems", label: "Problems" },
  { prefix: "/experts", label: "Experts" },
  { prefix: "/companies", label: "Companies" },
  { prefix: "/rooms", label: "Rooms" },
  { prefix: "/profile", label: "Profile" },
];

function sectionLabel(pathname: string): string {
  const match = SECTION_LABELS.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match?.label ?? "Mass Academy";
}

export function HeaderTitle() {
  const pathname = usePathname();
  return (
    <span className="text-[0.8125rem] font-medium tracking-[0.04em]">
      {sectionLabel(pathname)}
    </span>
  );
}
