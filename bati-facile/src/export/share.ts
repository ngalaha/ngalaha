import * as Sharing from 'expo-sharing';

/** Partage un fichier local via les applications Android installées (hors ligne, aucun serveur requis). */
export async function shareFile(uri: string, mimeType: string, dialogTitle: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Le partage n'est pas disponible sur cet appareil");
  }
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}
