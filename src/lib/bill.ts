import type { Contact, ExtraTxn, MilkEntry } from "../types";
import { EXTRA_LABELS, KIND_LABELS } from "../types";
import { entryTotals, extraSigned, formatInr, formatLitres } from "./calc";

export function shareOnWhatsApp(text: string, phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const withCountry =
    digits.length === 10 ? `91${digits}` : digits.length > 10 ? digits : "";
  const url = withCountry
    ? `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function printHtml(title: string, bodyHtml: string) {
  const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      color: #111;
      font-size: 13px;
      line-height: 1.4;
      margin: 0;
    }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 16px 0 8px; }
    .muted { color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f3f3f3; }
    td.num, th.num { text-align: right; white-space: nowrap; }
    .total { font-weight: 700; font-size: 15px; margin-top: 12px; }
    .actions { margin: 16px 0; display: flex; gap: 8px; flex-wrap: wrap; }
    .actions button {
      padding: 10px 16px;
      font-size: 14px;
      border-radius: 8px;
      border: 1px solid #ccc;
      background: #1e4d6b;
      color: #fff;
      cursor: pointer;
    }
    @media print {
      body { padding: 0; }
      .actions { display: none !important; }
    }
  </style>
</head>
<body>
  ${bodyHtml}
  <div class="actions">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
    <button type="button" onclick="window.close()">Close</button>
  </div>
</body>
</html>`;

  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      // Popup blocked — download HTML instead
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeTitle.replace(/\s+/g, "_") || "bill"}.html`;
      a.click();
      alert("Popup blocked. HTML file downloaded — open it and Print → Save as PDF.");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }
    // Revoke after load so memory is freed later
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    console.error(err);
    alert("Could not open print page. Try again or use WhatsApp share.");
  }
}

export function buildContactBillText(opts: {
  contact: Contact;
  month: string;
  entries: MilkEntry[];
  extras: ExtraTxn[];
}): string {
  const { contact, month, entries, extras } = opts;
  const lines: string[] = [];
  lines.push(`*DudhKhata Bill*`);
  lines.push(`${contact.name} (${KIND_LABELS[contact.kind]})`);
  lines.push(`Month: ${month}`);
  lines.push(`----------------`);

  let milkTotal = 0;
  let litresTotal = 0;
  for (const e of entries) {
    const t = entryTotals(e);
    milkTotal += t.amount;
    litresTotal += t.litres;
    lines.push(
      `${e.entryDate}: M ${e.morningLitres || 0}L@${e.morningFat || 0} E ${e.eveningLitres || 0}L@${e.eveningFat || 0} = ${formatInr(t.amount)}`
    );
  }
  if (entries.length === 0) lines.push(`No milk entries`);

  lines.push(`----------------`);
  lines.push(`Total milk: ${formatLitres(litresTotal)} = ${formatInr(milkTotal)}`);

  let extraNet = 0;
  if (extras.length) {
    lines.push(`*Extras*`);
    for (const x of extras) {
      const signed = extraSigned(contact.kind, x);
      extraNet += signed;
      lines.push(`${x.entryDate}: ${EXTRA_LABELS[x.type]} ${formatInr(x.amount)}`);
    }
  }

  const settlement = milkTotal + extraNet;
  lines.push(`----------------`);
  lines.push(`*Settlement: ${formatInr(settlement)}*`);
  lines.push(`(DudhKhata)`);
  return lines.join("\n");
}

export function buildContactBillHtml(opts: {
  contact: Contact;
  month: string;
  entries: MilkEntry[];
  extras: ExtraTxn[];
}): string {
  const { contact, month, entries, extras } = opts;
  let milkTotal = 0;
  let litresTotal = 0;
  const rows = entries
    .map((e) => {
      const t = entryTotals(e);
      milkTotal += t.amount;
      litresTotal += t.litres;
      return `<tr>
        <td>${e.entryDate}</td>
        <td class="num">${e.morningLitres || "-"}</td>
        <td class="num">${e.morningFat || "-"}</td>
        <td class="num">${e.eveningLitres || "-"}</td>
        <td class="num">${e.eveningFat || "-"}</td>
        <td class="num">${formatInr(t.amount)}</td>
      </tr>`;
    })
    .join("");

  let extraNet = 0;
  const extraRows = extras
    .map((x) => {
      extraNet += extraSigned(contact.kind, x);
      return `<tr>
        <td>${x.entryDate}</td>
        <td>${EXTRA_LABELS[x.type]}</td>
        <td>${x.note || ""}</td>
        <td class="num">${formatInr(x.amount)}</td>
      </tr>`;
    })
    .join("");

  const settlement = milkTotal + extraNet;

  return `
    <h1>DudhKhata — Monthly Statement</h1>
    <p class="muted">${escapeHtml(contact.name)} · ${KIND_LABELS[contact.kind]}${
      contact.phone ? " · " + escapeHtml(contact.phone) : ""
    }</p>
    <p class="muted">Month: ${escapeHtml(month)}</p>
    <h2>Milk entries</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th class="num">M L</th>
          <th class="num">M Fat</th>
          <th class="num">E L</th>
          <th class="num">E Fat</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="6">No entries</td></tr>`}
      </tbody>
    </table>
    <p>Total milk: ${formatLitres(litresTotal)} · ${formatInr(milkTotal)}</p>
    ${
      extras.length
        ? `<h2>Extras</h2>
    <table>
      <thead><tr><th>Date</th><th>Type</th><th>Note</th><th class="num">Amount</th></tr></thead>
      <tbody>${extraRows}</tbody>
    </table>`
        : ""
    }
    <p class="total">Settlement: ${formatInr(settlement)}</p>
    <p class="muted">Generated by DudhKhata</p>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMonthSummaryText(opts: {
  month: string;
  rows: {
    name: string;
    kind: string;
    litres: number;
    milkAmt: number;
    extraNet: number;
    settlement: number;
  }[];
  totalLitres: number;
  totalMilk: number;
  grandSettlement: number;
}): string {
  const lines: string[] = [];
  lines.push(`*DudhKhata — ${opts.month} Summary*`);
  lines.push(`----------------`);
  for (const r of opts.rows) {
    lines.push(
      `${r.name} (${r.kind}): ${formatLitres(r.litres)} · ${formatInr(r.settlement)}`
    );
  }
  lines.push(`----------------`);
  lines.push(`Total milk: ${formatLitres(opts.totalLitres)} · ${formatInr(opts.totalMilk)}`);
  lines.push(`*Net settlement: ${formatInr(opts.grandSettlement)}*`);
  return lines.join("\n");
}

export function buildMonthSummaryHtml(opts: {
  month: string;
  rows: {
    name: string;
    kind: string;
    entryCount: number;
    litres: number;
    milkAmt: number;
    extraNet: number;
    settlement: number;
  }[];
  totalLitres: number;
  totalMilk: number;
  grandSettlement: number;
}): string {
  const rows = opts.rows
    .map(
      (r) => `<tr>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.kind)}</td>
      <td class="num">${r.entryCount}</td>
      <td class="num">${formatLitres(r.litres)}</td>
      <td class="num">${formatInr(r.milkAmt)}</td>
      <td class="num">${formatInr(r.extraNet)}</td>
      <td class="num">${formatInr(r.settlement)}</td>
    </tr>`
    )
    .join("");

  return `
    <h1>DudhKhata — Monthly Settlement</h1>
    <p class="muted">Month: ${escapeHtml(opts.month)}</p>
    <table>
      <thead>
        <tr>
          <th>Contact</th>
          <th>Type</th>
          <th class="num">Entries</th>
          <th class="num">Litres</th>
          <th class="num">Milk</th>
          <th class="num">Extras</th>
          <th class="num">Settlement</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="7">No data</td></tr>`}</tbody>
    </table>
    <p class="total">Total milk: ${formatLitres(opts.totalLitres)} · ${formatInr(opts.totalMilk)}</p>
    <p class="total">Net settlement: ${formatInr(opts.grandSettlement)}</p>
    <p class="muted">Generated by DudhKhata · Use Print → Save as PDF</p>
  `;
}
