"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LiveSearchProps = {
  initialQuery: string;
  placeholder?: string;
};

export function LiveSearch({ initialQuery, placeholder = "Search..." }: LiveSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(initialQuery);

  const baseParams = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    return params;
  }, [searchParams]);

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
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [baseParams, pathname, router, value]);

  return (
    <input
      id="q"
      name="q"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      className="ui-input text-sm"
      autoComplete="off"
    />
  );
}

