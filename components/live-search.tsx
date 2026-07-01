"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LiveSearchProps = {
  initialQuery: string;
  placeholder?: string;
};

export function LiveSearch({ initialQuery, placeholder = "Search directory records..." }: LiveSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [value, setValue] = useState(initialQuery);


  const baseParams = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    params.delete("page");
    return params;
  }, [searchParamsString]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(baseParams.toString());
      const normalized = value.trim();

      if (normalized) {
        params.set("q", normalized);
      } else {
        params.delete("q");
      }

      const query = params.toString();

      const currentParams = new URLSearchParams(searchParamsString);
      currentParams.delete("page");
      const currentQuery = currentParams.toString();

      if (query === currentQuery) {
        return;
      }

      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [baseParams, pathname, router, searchParamsString, value]);

  return (
    <div className="relative w-full max-w-md group">

      {/* Structural SVG Search Lens Icon */}
      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none ui-subtle opacity-60 group-focus-within:opacity-100 transition-opacity z-10">
        <svg
          className="h-4 w-4 stroke-[2.5]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <input
        id="q"
        name="q"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="ui-input w-full !pl-10 !pr-9 text-sm font-medium h-[40px] shadow-sm shadow-black/[0.02]"
        autoComplete="off"
      />

      {/* Manual Value Reset Button */}
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute inset-y-0 right-2.5 my-auto h-5 w-5 rounded-md flex items-center justify-center ui-subtle hover:bg-[var(--surface-strong)] text-[10px] font-bold tracking-tight cursor-pointer transition-colors"
          aria-label="Clear search input"
        >
          ✕
        </button>
      )}

    </div>
  );
}