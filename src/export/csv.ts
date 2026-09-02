import { File, Paths } from 'expo-file-system';
import type { Order } from '../models/Order';
import { formatNumber } from '../calculationEngine/format';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function orderToCsv(order: Order): string {
  const header = ['Description', 'Théorique', 'Avec marge', 'À commander', 'Unité', 'Notes'];
  const rows = order.lines.map((line) =>
    [
      line.description,
      formatNumber(line.result.exact, 3),
      formatNumber(line.result.withMargin, 3),
      formatNumber(line.result.recommended, 3),
      line.result.unit,
      line.notes ?? '',
    ]
      .map((v) => csvEscape(String(v)))
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

/** Écrit le CSV de la commande dans le cache de l'appareil (hors ligne) et retourne son URI. */
export function writeOrderCsvFile(order: Order): string {
  const content = orderToCsv(order);
  const safeName = order.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'commande';
  const file = new File(Paths.cache, `${safeName}.csv`);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(content);
  return file.uri;
}
