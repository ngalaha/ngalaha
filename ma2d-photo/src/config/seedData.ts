import { Building, Project, emptyOneDriveFolderRef } from '@/types';

/**
 * First-run seed data: Projet Champfleury with buildings A-F.
 *
 * IMPORTANT: OneDrive share links below are placeholders. They must be
 * replaced by the administrator from the Administration screen (or by
 * editing this file before the first launch) with the real "Copy link"
 * URL of each building's Photo folder in OneDrive.
 *
 * Do NOT invent real OneDrive links, Drive IDs or Item IDs — leave the
 * placeholder text "À_RENSEIGNER" until the real value is provided.
 */

const CHAMPFLEURY_PROJECT_ID = 'projet-champfleury';

export const SEED_PROJECTS: Project[] = [
  {
    id: CHAMPFLEURY_PROJECT_ID,
    name: 'Champfleury',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

const BUILDING_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export const SEED_BUILDINGS: Building[] = BUILDING_LETTERS.map((letter) => ({
  id: `${CHAMPFLEURY_PROJECT_ID}-batiment-${letter.toLowerCase()}`,
  projectId: CHAMPFLEURY_PROJECT_ID,
  name: `Bâtiment ${letter}`,
  photoFolder: {
    ...emptyOneDriveFolderRef(),
    // Placeholder — must be filled in via Administration > Bâtiment > Modifier.
    shareUrl: 'À_RENSEIGNER',
  },
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}));
