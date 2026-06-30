import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-display";

type UserAvatarProps = {
  givenName?: string | null;
  familyName?: string | null;
  email?: string | null;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "size-7 text-[0.625rem]",
  md: "size-8 text-[0.6875rem]",
} as const;

export function UserAvatar({
  givenName,
  familyName,
  email,
  size = "md",
  className,
}: UserAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-medium tracking-wide text-accent-foreground",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {getUserInitials(givenName, familyName, email)}
    </span>
  );
}
