export function getUserInitials(
  givenName?: string | null,
  familyName?: string | null,
  email?: string | null,
) {
  if (givenName && familyName) {
    return `${givenName[0] ?? ""}${familyName[0] ?? ""}`.toUpperCase();
  }
  if (givenName) return givenName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "MA";
}

export function formatRelativeTime(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatJoinedYear(date: Date) {
  return date.getFullYear().toString();
}

export const MY_PROFILE_PATH = "/profile/me";
