export interface Project {
  id: string;
  name: string;
  description?: string;
  /** Nom du client, affiché sur le devis exporté. */
  clientName?: string;
  /** Téléphone du client, affiché sur le devis exporté. */
  clientPhone?: string;
  /** Adresse du chantier, affichée sur le devis exporté. */
  siteAddress?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface ProjectSummary extends Project {
  wallCount: number;
  totalBlocks: number; // somme des blocs recommandés (après marge), tous formats confondus
}
