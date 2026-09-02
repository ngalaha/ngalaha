export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface ProjectSummary extends Project {
  concreteElementCount: number;
  panelElementCount: number;
  totalConcreteVolume: number; // m³ exact
}
