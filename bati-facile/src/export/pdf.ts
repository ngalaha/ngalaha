import * as Print from 'expo-print';
import type { Project } from '../models/Project';
import type { BlockFormat } from '../materials/blocks';
import type { QuantityResult } from '../calculationEngine/types';
import type { MortarResult } from '../calculationEngine/mortar';
import type { BourrageResult } from '../calculationEngine/bourrage';
import { formatM3, formatNumber } from '../calculationEngine/format';

export interface BlockOrderLine {
  block: BlockFormat;
  wallCount: number;
  quantity: QuantityResult;
}

export interface PoseLine {
  block: BlockFormat;
  totalBlocks: number;
  totalNetSurface: number;
  mortar: MortarResult;
  isEstimated: boolean;
}

export interface BourrageLine {
  block: BlockFormat;
  totalBlocks: number;
  bourrage: BourrageResult;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function devisToHtml(
  project: Project,
  blockOrders: BlockOrderLine[],
  poseGroups: PoseLine[],
  bourrageGroups: BourrageLine[],
  marginPercent: number
): string {
  const blockRows = blockOrders
    .map(
      (o) => `
        <tr>
          <td>${escapeHtml(o.block.label)}</td>
          <td>${o.wallCount}</td>
          <td>${formatNumber(o.quantity.exact, 1)}</td>
          <td class="strong">${o.quantity.recommended}</td>
        </tr>`
    )
    .join('');

  const poseRows = poseGroups
    .map(
      (g) => `
        <tr>
          <td>${escapeHtml(g.block.label)}</td>
          <td>${formatNumber(g.mortar.cimentKg / 50, 1)} sac(s)</td>
          <td>${
            g.mortar.sableBrouettes !== undefined
              ? `${formatNumber(g.mortar.sableBrouettes, 1)} brouette(s)`
              : `${formatM3(g.mortar.sableM3)} (estimé)`
          }</td>
          <td>${g.isEstimated ? 'Estimation volumétrique' : 'Ratio terrain confirmé'}</td>
        </tr>`
    )
    .join('');

  const bourrageRows = bourrageGroups
    .map(
      (g) => `
        <tr>
          <td>${escapeHtml(g.block.label)}</td>
          <td>${formatM3(g.bourrage.volumeBeton)}</td>
          <td>${formatNumber(g.bourrage.cimentKg / 50, 1)} sac(s)</td>
          <td>${formatM3(g.bourrage.sableM3)}</td>
          <td>${formatM3(g.bourrage.gravierM3)}</td>
        </tr>`
    )
    .join('');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Roboto, Arial, sans-serif; color: #241A12; padding: 24px; }
        h1 { color: #B5501C; margin-bottom: 4px; }
        h2 { color: #B5501C; font-size: 15px; margin-top: 28px; }
        .meta { color: #7A6857; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #E8DCCB; font-size: 13px; }
        th { background: #F3E9DE; color: #241A12; }
        .strong { font-weight: 700; color: #B5501C; }
        .note { color: #C77F16; font-size: 11px; margin-top: 8px; }
        .footer { margin-top: 24px; color: #7A6857; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(project.name)}</h1>
      <div class="meta">
        Devis quantitatif — Marge de casse : ${marginPercent}% —
        Généré le ${new Date().toLocaleDateString('fr-FR')}
      </div>

      <h2>Blocs (parpaings) à commander</h2>
      <table>
        <thead><tr><th>Format</th><th>Murs</th><th>Théorique</th><th>À commander</th></tr></thead>
        <tbody>${blockRows || '<tr><td colspan="4">Aucun</td></tr>'}</tbody>
      </table>

      ${
        poseGroups.length > 0
          ? `<h2>Mortier de pose (murs non bourrés)</h2>
      <table>
        <thead><tr><th>Format</th><th>Ciment</th><th>Sable</th><th>Méthode</th></tr></thead>
        <tbody>${poseRows}</tbody>
      </table>`
          : ''
      }

      ${
        bourrageGroups.length > 0
          ? `<h2>Béton de bourrage (soubassement)</h2>
      <table>
        <thead><tr><th>Format</th><th>Volume béton</th><th>Ciment</th><th>Sable</th><th>Gravier</th></tr></thead>
        <tbody>${bourrageRows}</tbody>
      </table>
      <div class="note">Bourrage estimé sur un taux de vide de 55% (à confirmer sur le terrain).</div>`
          : ''
      }

      <div class="footer">Bâti Facile — document généré hors ligne</div>
    </body>
  </html>`;
}

/** Génère un devis quantitatif PDF et retourne son URI local (cache de l'appareil). */
export async function generateOrderPdf(
  project: Project,
  blockOrders: BlockOrderLine[],
  poseGroups: PoseLine[],
  bourrageGroups: BourrageLine[],
  marginPercent: number
): Promise<string> {
  const html = devisToHtml(project, blockOrders, poseGroups, bourrageGroups, marginPercent);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}
