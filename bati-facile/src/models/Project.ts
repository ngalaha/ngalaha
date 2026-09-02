export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface ProjectSummary extends Project {
  wallCount: number;
  totalBlocks: number; // somme des blocs recommandés (après marge), tous formats confondus
}
