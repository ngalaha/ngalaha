/** Identifiant local unique, sans dépendance réseau (fonctionne hors ligne). */
export function generateId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
