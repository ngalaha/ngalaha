import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { useTheme } from '../styles/ThemeContext';
import { getProject, listWalls } from '../storage/projects';
import type { Project } from '../models/Project';
import type { Wall } from '../models/Wall';
import { getBlockFormat, WASTE_MARGIN_PRESETS, type BlockFormat } from '../materials/blocks';
import { sumWallsBlocks } from '../calculationEngine/blocks';
import { buildQuantityResult } from '../calculationEngine/quantity';
import { computePoseMortar, computePoseMortarForBlockCount, type MortarResult } from '../calculationEngine/mortar';
import { computeBourrage } from '../calculationEngine/bourrage';
import { formatM3, formatNumber } from '../calculationEngine/format';
import { generateOrderPdf } from '../export/pdf';
import { shareFile } from '../export/share';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjetDetail'>;

export function ProjetDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { colors, spacing, typography, radius } = useTheme();
  const [project, setProject] = useState<Project | undefined>();
  const [walls, setWalls] = useState<Wall[]>([]);
  const [marginPercent, setMarginPercent] = useState<number>(5);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(() => {
    getProject(projectId).then(setProject);
    listWalls(projectId).then(setWalls);
  }, [projectId]);

  useFocusEffect(refresh);

  const entries = useMemo(() => walls.map((wall) => ({ wall, block: getBlockFormat(wall.blockId) })), [walls]);

  const sumResult = useMemo(() => sumWallsBlocks(entries), [entries]);

  const blockOrders = useMemo(() => {
    if (!sumResult.ok) return [];
    return Object.values(sumResult.value.totalsByBlock).map((total) => ({
      block: total.block,
      wallCount: total.wallCount,
      quantity: buildQuantityResult(total.totalExactBlocks, 'bloc', marginPercent, { type: 'integer' }),
    }));
  }, [sumResult, marginPercent]);

  const poseGroups = useMemo(() => {
    if (!sumResult.ok) return [];
    const groups = new Map<string, { block: BlockFormat; totalBlocks: number; totalNetSurface: number }>();
    for (const line of sumResult.value.lines) {
      if (line.wall.bourre) continue;
      const existing = groups.get(line.block.id);
      if (existing) {
        existing.totalBlocks += line.exactBlocks;
        existing.totalNetSurface += line.netSurface;
      } else {
        groups.set(line.block.id, { block: line.block, totalBlocks: line.exactBlocks, totalNetSurface: line.netSurface });
      }
    }
    return Array.from(groups.values()).map((g) => {
      const confirmed = computePoseMortarForBlockCount(g.totalBlocks, g.block);
      const mortar: MortarResult = confirmed ?? computePoseMortar(g.totalNetSurface);
      return { ...g, mortar, isEstimated: confirmed === undefined };
    });
  }, [sumResult]);

  const bourrageGroups = useMemo(() => {
    if (!sumResult.ok) return [];
    const groups = new Map<string, { block: BlockFormat; totalBlocks: number }>();
    for (const line of sumResult.value.lines) {
      if (!line.wall.bourre) continue;
      const existing = groups.get(line.block.id);
      if (existing) {
        existing.totalBlocks += line.exactBlocks;
      } else {
        groups.set(line.block.id, { block: line.block, totalBlocks: line.exactBlocks });
      }
    }
    return Array.from(groups.values()).map((g) => ({ ...g, bourrage: computeBourrage(g.totalBlocks, g.block) }));
  }, [sumResult]);

  const totalPoseCimentSacs = poseGroups.reduce((sum, g) => sum + g.mortar.cimentKg / 50, 0);
  const totalBourrageCimentSacs = bourrageGroups.reduce((sum, g) => sum + g.bourrage.cimentKg / 50, 0);

  async function exporterPdf() {
    if (!project) return;
    setExporting(true);
    try {
      const uri = await generateOrderPdf(project, blockOrders, poseGroups, bourrageGroups, marginPercent);
      await shareFile(uri, 'application/pdf', 'Partager le devis (PDF)');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>
        {project?.name ?? 'Projet'}
      </Text>

      <Button label="+ Ajouter / gérer les murs" onPress={() => navigation.navigate('Murs', { projectId })} />

      {!sumResult.ok && walls.length > 0 ? (
        <Text style={{ color: colors.danger }}>
          {sumResult.errors.map((e) => e.message).join('\n')}
        </Text>
      ) : null}

      {walls.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Aucun mur pour l'instant. Ajoutez-en pour voir le devis.</Text>
      ) : (
        <>
          <Text style={{ color: colors.textMuted }}>Marge de casse</Text>
          <View style={styles.pillRow}>
            {WASTE_MARGIN_PRESETS.map((p) => (
              <Pill key={p} label={`${p}%`} active={marginPercent === p} onPress={() => setMarginPercent(p)} />
            ))}
          </View>

          <Text style={{ color: colors.text, fontWeight: '700', marginTop: spacing.sm }}>Blocs à commander</Text>
          {blockOrders.map((o) => (
            <View key={o.block.id} style={[styles.row, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
              <Text style={{ color: colors.text }}>{o.block.label} ({o.wallCount} mur{o.wallCount > 1 ? 's' : ''})</Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{o.quantity.recommended} blocs</Text>
            </View>
          ))}

          {poseGroups.length > 0 && (
            <>
              <Text style={{ color: colors.text, fontWeight: '700', marginTop: spacing.sm }}>
                Mortier de pose (murs non bourrés)
              </Text>
              {poseGroups.map((g) => (
                <View key={g.block.id} style={[styles.mortarCard, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{g.block.label}</Text>
                  <Text style={{ color: colors.text }}>
                    Ciment : {formatNumber(g.mortar.cimentKg / 50, 1)} sac(s) de 50 kg
                  </Text>
                  <Text style={{ color: colors.text }}>
                    Sable : {g.mortar.sableBrouettes !== undefined ? `${formatNumber(g.mortar.sableBrouettes, 1)} brouette(s)` : `${formatM3(g.mortar.sableM3)} (estimé)`}
                  </Text>
                  {g.isEstimated ? (
                    <Text style={{ color: colors.warning, fontSize: typography.sizes.xs }}>
                      Estimation volumétrique — pas de ratio terrain confirmé pour ce format.
                    </Text>
                  ) : null}
                </View>
              ))}
            </>
          )}

          {bourrageGroups.length > 0 && (
            <>
              <Text style={{ color: colors.text, fontWeight: '700', marginTop: spacing.sm }}>
                Béton de bourrage (soubassement bourré)
              </Text>
              {bourrageGroups.map((g) => (
                <View key={g.block.id} style={[styles.mortarCard, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{g.block.label}</Text>
                  <Text style={{ color: colors.text }}>Volume : {formatM3(g.bourrage.volumeBeton)}</Text>
                  <Text style={{ color: colors.text }}>Ciment : {formatNumber(g.bourrage.cimentKg / 50, 1)} sac(s)</Text>
                  <Text style={{ color: colors.text }}>Sable : {formatM3(g.bourrage.sableM3)}</Text>
                  <Text style={{ color: colors.text }}>Gravier : {formatM3(g.bourrage.gravierM3)}</Text>
                  <Text style={{ color: colors.warning, fontSize: typography.sizes.xs }}>
                    Estimation (taux de vide 55%) — à confirmer sur le terrain.
                  </Text>
                </View>
              ))}
            </>
          )}

          <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={{ color: colors.textMuted }}>Total ciment (pose + bourrage)</Text>
            <Text style={{ color: colors.primary, fontSize: typography.sizes.xl, fontWeight: '700' }}>
              {Math.ceil(totalPoseCimentSacs + totalBourrageCimentSacs)} sacs
            </Text>
          </View>

          <Button label="Exporter le devis (PDF)" onPress={exporterPdf} loading={exporting} big />
        </>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  mortarCard: {
    padding: 12,
    gap: 4,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
});
