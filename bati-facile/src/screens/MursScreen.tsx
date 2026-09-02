import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { NumberField } from '../components/NumberField';
import { useTheme } from '../styles/ThemeContext';
import { BLOCK_CATALOG, DEFAULT_JOINT_EPAISSEUR_M, defaultBlockForLevel, getBlockFormat, type WallLevel } from '../materials/blocks';
import { computeWallBlocks } from '../calculationEngine/blocks';
import { formatNumber } from '../calculationEngine/format';
import { cmToM, mToCm } from '../calculationEngine/units';
import { parseDecimal } from '../utils/parseDecimal';
import { deleteWall, listWalls, saveWall } from '../storage/projects';
import type { Opening, Wall } from '../models/Wall';
import { generateId } from '../utils/id';

type Props = NativeStackScreenProps<RootStackParamList, 'Murs'>;

const NIVEAUX: { key: WallLevel; label: string }[] = [
  { key: 'soubassement', label: 'Soubassement' },
  { key: 'elevation', label: 'Élévation' },
  { key: 'cloison', label: 'Cloison' },
];

/**
 * Version "brouillon" d'une ouverture : les dimensions restent en texte brut
 * pendant la saisie (comme les champs du mur) pour ne pas perdre la virgule
 * décimale en cours de frappe. La conversion en nombres n'a lieu qu'à
 * l'ajout du mur.
 */
interface OpeningDraft {
  id: string;
  largeur: string;
  hauteur: string;
  quantite: string;
}

export function MursScreen({ route }: Props) {
  const { projectId } = route.params;
  const { colors, spacing, typography, radius } = useTheme();

  const [walls, setWalls] = useState<Wall[]>([]);
  const [label, setLabel] = useState('');
  const [niveau, setNiveau] = useState<WallLevel>('elevation');
  const [blockId, setBlockId] = useState(defaultBlockForLevel('elevation').id);
  const [longueur, setLongueur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [jointCm, setJointCm] = useState(String(mToCm(DEFAULT_JOINT_EPAISSEUR_M)));
  const [bourre, setBourre] = useState(false);
  const [openingDrafts, setOpeningDrafts] = useState<OpeningDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listWalls(projectId).then(setWalls);
  }, [projectId]);

  useFocusEffect(refresh);

  function selectNiveau(n: WallLevel) {
    setNiveau(n);
    setBlockId(defaultBlockForLevel(n).id);
    setBourre(n === 'soubassement');
  }

  function addOpening() {
    setOpeningDrafts((prev) => [...prev, { id: generateId(), largeur: '', hauteur: '', quantite: '1' }]);
  }

  function updateOpeningDraft(id: string, field: keyof OpeningDraft, raw: string) {
    setOpeningDrafts((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: raw } : o)));
  }

  function removeOpeningDraft(id: string) {
    setOpeningDrafts((prev) => prev.filter((o) => o.id !== id));
  }

  /** Convertit les brouillons texte en `Opening[]` numériques, ou retourne un message d'erreur. */
  function resolveOpenings(): { ok: true; openings: Opening[] } | { ok: false; error: string } {
    const openings: Opening[] = [];
    for (const [index, draft] of openingDrafts.entries()) {
      const largeur = parseDecimal(draft.largeur);
      const hauteur = parseDecimal(draft.hauteur);
      const quantite = parseInt(draft.quantite.trim() || '1', 10);
      if (largeur === undefined || largeur <= 0) {
        return { ok: false, error: `Ouverture ${index + 1} : largeur invalide` };
      }
      if (hauteur === undefined || hauteur <= 0) {
        return { ok: false, error: `Ouverture ${index + 1} : hauteur invalide` };
      }
      if (!Number.isFinite(quantite) || quantite < 1) {
        return { ok: false, error: `Ouverture ${index + 1} : quantité invalide` };
      }
      openings.push({ id: draft.id, largeur, hauteur, quantite });
    }
    return { ok: true, openings };
  }

  async function ajouterMur() {
    setError(null);
    const l = parseDecimal(longueur);
    const h = parseDecimal(hauteur);
    const jointCmValue = parseDecimal(jointCm);
    if (l === undefined || l <= 0) return setError('Longueur du mur invalide');
    if (h === undefined || h <= 0) return setError('Hauteur du mur invalide');
    if (jointCmValue === undefined || jointCmValue < 0) return setError('Épaisseur de joint invalide');

    const openingsResult = resolveOpenings();
    if (!openingsResult.ok) return setError(openingsResult.error);

    const block = getBlockFormat(blockId);
    const wallDraft = {
      projectId,
      label: label.trim() || `Mur ${walls.length + 1}`,
      longueur: l,
      hauteur: h,
      niveau,
      blockId,
      jointEpaisseur: cmToM(jointCmValue),
      openings: openingsResult.openings,
      bourre,
    };
    const check = computeWallBlocks(wallDraft as Wall, block);
    if (!check.ok) return setError(check.errors.map((e) => e.message).join('\n'));

    await saveWall(wallDraft);
    setLabel('');
    setLongueur('');
    setHauteur('');
    setOpeningDrafts([]);
    refresh();
  }

  async function retirer(id: string) {
    await deleteWall(id);
    refresh();
  }

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>🧱 Ajouter un mur</Text>

      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="Nom du mur (ex: Mur pignon Nord)"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md }]}
      />

      <Text style={{ color: colors.textMuted }}>Niveau</Text>
      <View style={styles.pillRow}>
        {NIVEAUX.map((n) => (
          <Pill key={n.key} label={n.label} active={niveau === n.key} onPress={() => selectNiveau(n.key)} />
        ))}
      </View>

      <Text style={{ color: colors.textMuted }}>Format de bloc</Text>
      <View style={styles.pillRow}>
        {BLOCK_CATALOG.map((b) => (
          <Pill key={b.id} label={b.label} active={blockId === b.id} onPress={() => setBlockId(b.id)} />
        ))}
      </View>

      <NumberField label="Longueur du mur" value={longueur} onChangeValue={setLongueur} suffix="m" placeholder="ex: 5,20" />
      <NumberField label="Hauteur du mur" value={hauteur} onChangeValue={setHauteur} suffix="m" placeholder="ex: 2,80" />
      <NumberField label="Épaisseur du joint" value={jointCm} onChangeValue={setJointCm} suffix="cm" />

      <Text style={{ color: colors.textMuted }}>Bourrage (alvéoles remplies de béton)</Text>
      <View style={styles.pillRow}>
        <Pill label="Non bourré" active={!bourre} onPress={() => setBourre(false)} />
        <Pill label="Bourré" active={bourre} onPress={() => setBourre(true)} />
      </View>

      <Text style={{ color: colors.text, fontWeight: '700', marginTop: spacing.sm }}>🚪 Ouvertures (portes, fenêtres)</Text>
      {openingDrafts.map((o, index) => (
        <View
          key={o.id}
          style={[styles.openingCard, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, gap: spacing.sm }]}
        >
          <View style={styles.openingCardHeader}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: typography.sizes.sm }}>
              Ouverture {index + 1}
            </Text>
            <Text onPress={() => removeOpeningDraft(o.id)} style={{ color: colors.danger, fontSize: typography.sizes.md }}>
              ✕
            </Text>
          </View>
          <View style={styles.openingRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>Largeur (m)</Text>
              <TextInput
                value={o.largeur}
                onChangeText={(v) => updateOpeningDraft(o.id, 'largeur', v)}
                placeholder="ex: 0,90"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.openingInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>Hauteur (m)</Text>
              <TextInput
                value={o.hauteur}
                onChangeText={(v) => updateOpeningDraft(o.id, 'hauteur', v)}
                placeholder="ex: 2,10"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.openingInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
            </View>
            <View style={{ width: 64, gap: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>Qté</Text>
              <TextInput
                value={o.quantite}
                onChangeText={(v) => updateOpeningDraft(o.id, 'quantite', v)}
                placeholder="1"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={[styles.openingInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
            </View>
          </View>
        </View>
      ))}
      <Button label="+ Ajouter une ouverture" variant="secondary" onPress={addOpening} />

      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      <Button label="+ Ajouter ce mur" onPress={ajouterMur} big />

      <Text style={{ color: colors.text, fontWeight: '700', marginTop: spacing.md }}>
        📋 Murs du projet ({walls.length})
      </Text>
      {walls.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Aucun mur ajouté.</Text>
      ) : (
        walls.map((w) => {
          const block = getBlockFormat(w.blockId);
          const result = computeWallBlocks(w, block);
          return (
            <View
              key={w.id}
              style={[styles.wallCard, { backgroundColor: colors.card, borderRadius: radius.md, shadowColor: colors.cardShadow }]}
            >
              <View>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{w.label}</Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>
                  {block?.label} • {NIVEAUX.find((n) => n.key === w.niveau)?.label}
                  {w.bourre ? ' • bourré' : ''}
                  {w.openings.length > 0 ? ` • ${w.openings.length} ouverture(s)` : ''}
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {result.ok ? `${formatNumber(result.value.exactBlocks, 1)} blocs` : '—'}
              </Text>
              <Text onPress={() => retirer(w.id)} style={{ color: colors.danger, fontSize: typography.sizes.md }}>
                ✕
              </Text>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  openingCard: {
    padding: 12,
  },
  openingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  openingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  openingInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  wallCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
});
