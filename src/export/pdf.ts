import * as Print from 'expo-print';
import type { Order } from '../models/Order';
import { formatNumber } from '../calculationEngine/format';

function orderToHtml(order: Order): string {
  const rows = order.lines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.description)}</td>
          <td>${formatNumber(line.result.exact, 3)} ${escapeHtml(line.result.unit)}</td>
          <td>${formatNumber(line.result.withMargin, 3)} ${escapeHtml(line.result.unit)}</td>
          <td class="strong">${formatNumber(line.result.recommended, 3)} ${escapeHtml(line.result.unit)}</td>
          <td>${escapeHtml(line.notes ?? '')}</td>
        </tr>`
    )
    .join('');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Roboto, Arial, sans-serif; color: #15201A; padding: 24px; }
        h1 { color: #1B5E3A; margin-bottom: 4px; }
        .meta { color: #5B6B62; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #DDE4E0; font-size: 13px; }
        th { background: #EEF2F0; color: #15201A; }
        .strong { font-weight: 700; color: #1B5E3A; }
        .footer { margin-top: 24px; color: #5B6B62; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(order.name)}</h1>
      <div class="meta">
        Marge de perte : ${order.marginPercent}% —
        Généré le ${new Date(order.updatedAt).toLocaleDateString('fr-CA')}
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Théorique</th>
            <th>Avec marge</th>
            <th>À commander</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Calcul Chantier — document généré hors ligne</div>
    </body>
  </html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Génère un PDF professionnel de commande et retourne son URI local (cache de l'appareil). */
export async function generateOrderPdf(order: Order): Promise<string> {
  const html = orderToHtml(order);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}
