import * as Print from 'expo-print';
import type { Project } from '../models/Project';
import type { BlockFormat } from '../materials/blocks';
import type { QuantityResult } from '../calculationEngine/types';
import type { MortarResult } from '../calculationEngine/mortar';
import type { BourrageResult } from '../calculationEngine/bourrage';
import type { TruckOrder } from '../calculationEngine/logistics';
import { formatM3, formatNumber } from '../calculationEngine/format';

export interface SandLogistics {
  totalSandM3: number;
  totalSandTonnes: number;
  needsTruckOrder: boolean;
  truckOrder: TruckOrder;
}

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
  marginPercent: number,
  sandLogistics?: SandLogistics
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
        .client { max-width: 360px; }
        .client th { width: 110px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(project.name)}</h1>
      <div class="meta">
        Devis quantitatif — Marge de casse : ${marginPercent}% —
        Généré le ${new Date().toLocaleDateString('fr-FR')}
      </div>

      ${
        project.clientName || project.clientPhone || project.siteAddress
          ? `<table class="client">
        <tbody>
          ${project.clientName ? `<tr><th>Client</th><td>${escapeHtml(project.clientName)}</td></tr>` : ''}
          ${project.clientPhone ? `<tr><th>Téléphone</th><td>${escapeHtml(project.clientPhone)}</td></tr>` : ''}
          ${project.siteAddress ? `<tr><th>Chantier</th><td>${escapeHtml(project.siteAddress)}</td></tr>` : ''}
        </tbody>
      </table>`
          : ''
      }

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

      ${
        sandLogistics && sandLogistics.totalSandM3 > 0
          ? `<h2>Sable — total et logistique</h2>
      <table>
        <tbody>
          <tr><th>Volume total</th><td>${formatM3(sandLogistics.totalSandM3)}</td></tr>
          <tr><th>Masse estimée</th><td>${formatNumber(sandLogistics.totalSandTonnes, 1)} t (densité 1,6 t/m³)</td></tr>
          ${
            sandLogistics.needsTruckOrder
              ? `<tr><th>Camions à commander</th><td class="strong">${sandLogistics.truckOrder.recommendedCount} × ${escapeHtml(sandLogistics.truckOrder.truck.label)}</td></tr>`
              : ''
          }
        </tbody>
      </table>
      ${
        sandLogistics.needsTruckOrder
          ? '<div class="note">Seuil de 20 t atteint ou dépassé — commande recommandée en camion plutôt qu\'au sac/à la brouette.</div>'
          : ''
      }`
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
  marginPercent: number,
  sandLogistics?: SandLogistics
): Promise<string> {
  const html = devisToHtml(project, blockOrders, poseGroups, bourrageGroups, marginPercent, sandLogistics);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}
