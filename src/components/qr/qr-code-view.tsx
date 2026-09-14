"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toDataURL } from "qrcode";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";

// Fixed regardless of on-screen display size — print-quality resolution
// independent of how large the <img> happens to render (spec FR-006a).
const QR_PRINT_SIZE = 1000;

// PDF grid: 3 rows x 2 columns = 6 copies per A4 page (spec FR-005a).
const PDF_GRID_COLS = 2;
const PDF_GRID_ROWS = 3;
const PDF_MARGIN = 30;

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const subscribeToNothing = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => null;

export function QrCodeView({ name, slug }: { name: string; slug: string }) {
  // window is unavailable during SSR — resolved client-side after mount
  // (research.md Decision 1: window.location.origin, never an env var).
  // useSyncExternalStore rather than a useEffect+setState (avoids the
  // cascading-render lint rule and matches qr-menu-dev's own pattern).
  const origin = useSyncExternalStore(subscribeToNothing, getOrigin, getServerOrigin);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const menuUrl = origin ? `${origin}/menu/${slug}` : null;

  useEffect(() => {
    if (!menuUrl) return;
    let cancelled = false;
    toDataURL(menuUrl, { width: QR_PRINT_SIZE, margin: 2 }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [menuUrl]);

  function handleDownloadPng() {
    if (!qrDataUrl) return;
    triggerDownload(qrDataUrl, `${slug}-qr-code.png`);
  }

  function handleDownloadPdf() {
    if (!qrDataUrl || !menuUrl) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const cellWidth = (pageWidth - PDF_MARGIN * 2) / PDF_GRID_COLS;
    const cellHeight = (pageHeight - PDF_MARGIN * 2) / PDF_GRID_ROWS;
    const qrSize = Math.min(cellWidth, cellHeight) - 90;

    for (let row = 0; row < PDF_GRID_ROWS; row++) {
      for (let col = 0; col < PDF_GRID_COLS; col++) {
        const cellX = PDF_MARGIN + col * cellWidth;
        const cellY = PDF_MARGIN + row * cellHeight;
        const centerX = cellX + cellWidth / 2;
        const nameY = cellY + 30;
        const qrX = cellX + (cellWidth - qrSize) / 2;
        const qrY = nameY + 20;

        doc.setFontSize(14);
        doc.text(name, centerX, nameY, { align: "center" });
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
        doc.setFontSize(9);
        doc.text(menuUrl, centerX, qrY + qrSize + 16, { align: "center" });
      }
    }

    doc.save(`${slug}-qr-code.pdf`);
  }

  const ready = !!qrDataUrl && !!menuUrl;
  const displayUrl = menuUrl?.replace(/^https?:\/\//, "") ?? "";

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-sm text-muted-foreground">Scan to view your menu</p>

      <div className="flex size-64 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data: URL, not an optimizable remote image
          <img src={qrDataUrl} alt={`QR code linking to ${name}'s menu`} className="size-full" />
        ) : (
          <div className="size-full animate-pulse bg-muted" />
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="font-heading text-lg font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{displayUrl || " "}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button size="lg" disabled={!ready} onClick={handleDownloadPng} className="h-11 w-full">
          Download PNG
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={!ready}
          onClick={handleDownloadPdf}
          className="h-11 w-full"
        >
          Download PDF
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Print and display this at your tables.
      </p>
    </div>
  );
}
