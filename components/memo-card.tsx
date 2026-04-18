"use client";

import { useEffect } from "react";

export function MemoCardLoader() {
  useEffect(() => {
    import("@quesoconjamon/memocard");
  }, []);

  return null;
}
