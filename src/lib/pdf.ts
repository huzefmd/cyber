import { jsPDF } from "jspdf";
import type { Severity } from "@/types/security";

export interface ReportFinding {
  category: string;
  title: string;
  description: string;
  severity: Severity | string;
  evidence: string | null;
  recommendation: string | null;
}

export interface ReportInput {
  domain: string;
  url: string;
  securityScore: number | null;
  riskLevel: string | null;
  sslStatus: string | null;
  scannedAt: string;
  findings: ReportFinding[];
}

const SEVERITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

const SEVERITY_RGB: Record<string, [number, number, number]> = {
  Critical: [220, 60, 70],
  High: [235, 140, 45],
  Medium: [225, 195, 60],
  Low: [80, 160, 235],
  Informational: [150, 158, 175],
};

/** Renders a branded, multi-page PDF security report entirely in the browser. */
export function buildReportPdf(input: ReportInput): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = 0;

  // Cover band
  doc.setFillColor(10, 14, 24);
  doc.rect(0, 0, pageWidth, 150, "F");
  doc.setFillColor(56, 189, 248);
  doc.rect(0, 148, pageWidth, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("CyberVault Security Report", margin, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(180, 195, 215);
  doc.text(input.domain, margin, 90);
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, 108);

  y = 190;
  doc.setTextColor(20, 24, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Summary", margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const summary: [string, string][] = [
    ["Target URL", input.url],
    ["Security score", input.securityScore == null ? "n/a" : `${input.securityScore} / 100`],
    ["Risk level", input.riskLevel ?? "n/a"],
    ["TLS / certificate", input.sslStatus ?? "n/a"],
    ["Scanned at", new Date(input.scannedAt).toLocaleString()],
    ["Findings", String(input.findings.length)],
  ];
  for (const [key, value] of summary) {
    doc.setTextColor(110, 118, 132);
    doc.text(key, margin, y);
    doc.setTextColor(20, 24, 34);
    doc.text(doc.splitTextToSize(value, pageWidth - margin * 2 - 130), margin + 130, y);
    y += 18;
  }

  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Findings", margin, y);
  y += 10;

  const sorted = [...input.findings].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );

  for (const finding of sorted) {
    const blocks: { label: string; text: string }[] = [
      { label: "", text: finding.description },
    ];
    if (finding.evidence) blocks.push({ label: "Evidence: ", text: finding.evidence });
    if (finding.recommendation)
      blocks.push({ label: "Recommendation: ", text: finding.recommendation });

    if (y > pageHeight - 140) {
      doc.addPage();
      y = margin;
    }

    y += 22;
    const rgb = SEVERITY_RGB[finding.severity] ?? SEVERITY_RGB["Informational"]!;
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.roundedRect(margin, y - 11, 62, 15, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(String(finding.severity).toUpperCase(), margin + 31, y - 0.5, { align: "center" });

    doc.setTextColor(20, 24, 34);
    doc.setFontSize(11.5);
    doc.text(doc.splitTextToSize(finding.title, pageWidth - margin * 2 - 78), margin + 74, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(105, 112, 126);
    doc.text(finding.category, margin + 74, y);
    y += 14;

    doc.setFontSize(10);
    doc.setTextColor(45, 52, 66);
    for (const block of blocks) {
      const lines = doc.splitTextToSize(
        `${block.label}${block.text}`,
        pageWidth - margin * 2 - 74,
      ) as string[];
      for (const line of lines) {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin + 74, y);
        y += 13;
      }
      y += 3;
    }

    doc.setDrawColor(228, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8.5);
    doc.setTextColor(150, 158, 175);
    doc.text(
      `CyberVault · ${input.domain} · page ${page} of ${pages}`,
      pageWidth / 2,
      pageHeight - 24,
      { align: "center" },
    );
  }

  return doc.output("blob");
}
