"use client";

import { DownloadIcon } from "@/components/ui/Icons";

/**
 * The resume page is a real, printable document — so "get a PDF" needs no
 * generated file to keep in sync, and no hosted asset to go stale. The browser's
 * own print pipeline produces something with selectable text and working links,
 * which a screenshot-in-a-PDF would not.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2.5 rounded-full border border-ink-600 bg-white px-5 py-2.5 text-[13px] font-medium text-navy-800 shadow-card transition-colors hover:border-signal-400 hover:text-signal-500"
    >
      <DownloadIcon className="h-4 w-4" />
      Print / Save as PDF
    </button>
  );
}
