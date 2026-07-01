"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type StatusBannerProps = {
  type: "success" | "error";
  message: string;
  autoCloseSeconds?: number;
};

export function StatusBanner({ type, message, autoCloseSeconds = 20 }: StatusBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(autoCloseSeconds);

  const clearStatus = useCallback(() => {
    setIsVisible(false);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("ok");
    nextParams.delete("error");

    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!isVisible || isPaused) {
      return;
    }

    // Move the interval tick logic into a functional state updater block.
    // This allows us to handle state transitions safely inside the asynchronous API callback.
    const timeoutId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(timeoutId);
          clearStatus();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timeoutId);
  }, [clearStatus, isPaused, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
        type === "success" ? "ui-alert-success" : "ui-alert-error"
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {type === "success" ? (
              <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            )}
            <p className="font-semibold">{message}</p>
          </div>

          <p className="text-[11px] opacity-75 font-mono tracking-wide pl-6">
            Auto-closing in {remainingSeconds}s {isPaused ? "• (counter paused)" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={clearStatus}
          className="rounded-lg border border-current/20 hover:border-current/40 hover:bg-current/5 px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shrink-0"
          aria-label="Dismiss status message"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}