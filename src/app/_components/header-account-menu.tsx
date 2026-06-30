"use client";

import {
  LoginLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/app/_components/user-avatar";
import { cn } from "@/lib/utils";

const menuItemClassName =
  "block w-full px-4 py-3 text-left label transition-colors hover:text-accent";

type HeaderAccountMenuProps = {
  authed: boolean;
  givenName?: string | null;
  familyName?: string | null;
  email?: string | null;
  profilePath: string;
};

export function HeaderAccountMenu({
  authed,
  givenName,
  familyName,
  email,
  profilePath,
}: HeaderAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={authed ? "Account menu" : "Sign in or apply"}
        className="transition-opacity hover:opacity-80"
      >
        {authed ? (
          <UserAvatar givenName={givenName} familyName={familyName} email={email} />
        ) : (
          <span
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-rule text-ink-faint",
            )}
            aria-hidden
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.25" stroke="currentColor" strokeWidth="1.25" />
              <path
                d="M2.5 12c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 min-w-44 border border-rule bg-paper py-1"
        >
          {authed ? (
            <Link href={profilePath} role="menuitem" className={menuItemClassName} onClick={close}>
              Profile
            </Link>
          ) : (
            <LoginLink
              postLoginRedirectURL="/feed"
              role="menuitem"
              className={menuItemClassName}
              onClick={close}
            >
              Sign in
            </LoginLink>
          )}
          <Link href="/#apply" role="menuitem" className={menuItemClassName} onClick={close}>
            Apply
          </Link>
          {authed && (
            <LogoutLink role="menuitem" className={menuItemClassName} onClick={close}>
              Sign out
            </LogoutLink>
          )}
        </div>
      )}
    </div>
  );
}
