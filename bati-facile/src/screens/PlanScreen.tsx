import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View, type GestureResponderEvent } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { NumberField } from '../components/NumberField';
import { useTheme } from '../styles/ThemeContext';
import { BLOCK_CATALOG, DEFAULT_JOINT_EPAISSEUR_M, defaultBlockForLevel, type WallLevel } from '../materials/blocks';
import { formatNumber } from '../calculationEngine/format';
import { cmToM, mToCm } from '../calculationEngine/units';
import { parseDecimal } from '../utils/parseDecimal';
import { distance, type Point } from '../utils/geometry';
import { generateId } from '../utils/id';
import { saveWall } from '../storage/projects';

type Props = NativeStackScreenProps<RootStackParamList, 'Plan'>;

const NIVEAUX: { key: WallLevel; label: string }[] = [
  { key: 'soubassement', label: 'Soubassement' },
  { key: 'elevation', label: 'Élévation' },
  { key: 'cloison', label: 'Cloison' },
];

interface Calibration {
  p1: Point;
  p2: Point;
  pixelDistance: number;
  realMeters: number;
  scaleMPerPx: number;
}

interface Segment {
  id: string;
  p1: Point;
  p2: Point;
  lengthMeters: number;
}

type Mode = 'calibrer' | 'tracer';

export function PlanScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { colors, spacing, typography, radius } = useTheme();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageAspect, setImageAspect] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  const [mode, setMode] = useState<Mode>('calibrer');
  const [pendingPoint, setPendingPoint] = useState<Point | null>(null);
  const [calibrationDraft, setCalibrationDraft] = useState<{ p1: Point; p2: Point; pixelDistance: number } | null>(null);
  const [calibDistanceInput, setCalibDistanceInput] = useState('');
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);

  const [niveau, setNiveau] = useState<WallLevel>('elevation');
  const [blockId, setBlockId] = useState(defaultBlockForLevel('elevation').id);
  const [hauteur, setHauteur] = useState('');
  const [jointCm, setJointCm] = useState(String(mToCm(DEFAULT_JOINT_EPAISSEUR_M)));
  const [bourre, setBourre] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  function selectNiveau(n: WallLevel) {
    setNiveau(n);
    setBlockId(defaultBlockForLevel(n).id);
    setBourre(n === 'soubassement');
  }

  function resetPlan() {
    setImageUri(null);
    setCalibration(null);
    setCalibrationDraft(null);
    setSegments([]);
    setPendingPoint(null);
    setMode('calibrer');
    setError(null);
    setCreatedCount(0);
  }

  async function choisirPhoto(source: 'library' | 'camera') {
    setError(null);
    const permission =
      source === 'library'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      setError("Permission refusée. Autorisez l'accès dans les paramètres du téléphone.");
      return;
    }

    const result =
      source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 })
        : await ImagePicker.launchCameraAsync({ quality: 1 });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    resetPlan();
    setImageUri(asset.uri);
    setImageAspect(asset.width && asset.height ? asset.width / asset.height : 1);
  }

  function handleCanvasTap(e: GestureResponderEvent) {
    const point: Point = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };

    if (!pendingPoint) {
      setPendingPoint(point);
      return;
    }

    const p1 = pendingPoint;
    const pixelDistance = distance(p1, point);
    setPendingPoint(null);

    if (pixelDistance < 4) return; // évite un double-tap accidentel au même endroit

    if (mode === 'calibrer') {
      setCalibrationDraft({ p1, p2: point, pixelDistance });
    } else if (calibration) {
      const lengthMeters = pixelDistance * calibration.scaleMPerPx;
      setSegments((prev) => [...prev, { id: generateId(), p1, p2: point, lengthMeters }]);
    }
  }

  function confirmerCalibration() {
    setError(null);
    const meters = parseDecimal(calibDistanceInput);
    if (!calibrationDraft) return;
    if (meters === undefined || meters <= 0) return setError('Distance réelle invalide');

    setCalibration({ ...calibrationDraft, realMeters: meters, scaleMPerPx: meters / calibrationDraft.pixelDistance });
    setCalibrationDraft(null);
    setCalibDistanceInput('');
    setSegments([]);
    setMode('tracer');
  }

  function recalibrer() {
    setCalibration(null);
    setCalibrationDraft(null);
    setPendingPoint(null);
    setSegments([]);
    setMode('calibrer');
  }

  function retirerSegment(id: string) {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  }

  async function creerLesMurs() {
    setError(null);
    const h = parseDecimal(hauteur);
    const jointCmValue = parseDecimal(jointCm);
    if (h === undefined || h <= 0) return setError('Hauteur du mur invalide');
    if (jointCmValue === undefined || jointCmValue < 0) return setError('Épaisseur de joint invalide');
    if (segments.length === 0) return setError('Aucun mur tracé');

    setCreating(true);
    try {
      for (let i = 0; i < segments.length; i++) {
        await saveWall({
          projectId,
          label: `Mur (plan) ${i + 1}`,
          longueur: segments[i].lengthMeters,
          hauteur: h,
          niveau,
          blockId,
          jointEpaisseur: cmToM(jointCmValue),
          openings: [],
          bourre,
        });
      }
      setCreatedCount(segments.length);
      setSegments([]);
    } finally {
      setCreating(false);
    }
  }

  const displayHeight = containerWidth > 0 ? containerWidth / imageAspect : 0;

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>📐 Relevé sur plan</Text>
      <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
        Téléversez une photo du plan, calibrez l'échelle avec une cote connue, puis tracez les murs — leur longueur
        réelle est calculée automatiquement.
      </Text>

      {!imageUri ? (
        <View style={styles.pillRow}>
          <Button label="🖼️ Choisir une photo" onPress={() => choisirPhoto('library')} />
          <Button label="📷 Prendre une photo" variant="secondary" onPress={() => choisirPhoto('camera')} />
        </View>
      ) : (
        <>
          <View style={styles.pillRow}>
            <Pill label="1. Calibrer l'échelle" active={mode === 'calibrer'} onPress={() => setMode('calibrer')} />
            <Pill
              label="2. Tracer les murs"
              active={mode === 'tracer'}
              onPress={() => calibration && setMode('tracer')}
            />
            <Pill label="🔄 Nouvelle photo" active={false} onPress={resetPlan} />
          </View>

          {!calibration ? (
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
              {calibrationDraft
                ? "Entrez la distance réelle de la ligne tracée (ex: une cote indiquée sur le plan)."
                : pendingPoint
                  ? 'Touchez le second point de la cote connue.'
                  : 'Touchez le premier point d\'une cote connue sur le plan (ex: une longueur de mur indiquée).'}
            </Text>
          ) : (
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
              Échelle : {formatNumber(calibration.realMeters, 2)} m sur {formatNumber(calibration.pixelDistance, 0)} px.{' '}
              {pendingPoint ? 'Touchez le second point du mur.' : 'Touchez le début d\'un mur.'}
            </Text>
          )}

          <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {containerWidth > 0 && (
              <View
                style={{ width: containerWidth, height: displayHeight, borderRadius: radius.md, overflow: 'hidden' }}
                onStartShouldSetResponder={() => true}
                onResponderRelease={handleCanvasTap}
              >
                <Image source={{ uri: imageUri }} style={{ width: containerWidth, height: displayHeight }} resizeMode="stretch" />
                <Svg width={containerWidth} height={displayHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
                  {calibration && (
                    <>
                      <Line
                        x1={calibration.p1.x} y1={calibration.p1.y} x2={calibration.p2.x} y2={calibration.p2.y}
                        stroke={colors.secondary} strokeWidth={3}
                      />
                      <Circle cx={calibration.p1.x} cy={calibration.p1.y} r={5} fill={colors.secondary} />
                      <Circle cx={calibration.p2.x} cy={calibration.p2.y} r={5} fill={colors.secondary} />
                    </>
                  )}
                  {calibrationDraft && (
                    <>
                      <Line
                        x1={calibrationDraft.p1.x} y1={calibrationDraft.p1.y} x2={calibrationDraft.p2.x} y2={calibrationDraft.p2.y}
                        stroke={colors.warning} strokeWidth={3}
                      />
                      <Circle cx={calibrationDraft.p1.x} cy={calibrationDraft.p1.y} r={5} fill={colors.warning} />
                      <Circle cx={calibrationDraft.p2.x} cy={calibrationDraft.p2.y} r={5} fill={colors.warning} />
                    </>
                  )}
                  {segments.map((s) => (
                    <React.Fragment key={s.id}>
                      <Line x1={s.p1.x} y1={s.p1.y} x2={s.p2.x} y2={s.p2.y} stroke={colors.primary} strokeWidth={3} />
                      <Circle cx={s.p1.x} cy={s.p1.y} r={4} fill={colors.primary} />
                      <Circle cx={s.p2.x} cy={s.p2.y} r={4} fill={colors.primary} />
                      <SvgText
                        x={(s.p1.x + s.p2.x) / 2}
                        y={(s.p1.y + s.p2.y) / 2 - 8}
                        fill={colors.primary}
                        fontSize={13}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {formatNumber(s.lengthMeters, 2)} m
                      </SvgText>
                    </React.Fragment>
                  ))}
                  {pendingPoint && <Circle cx={pendingPoint.x} cy={pendingPoint.y} r={6} fill={colors.danger} />}
                </Svg>
              </View>
            )}
          </View>

          {calibrationDraft && (
            <View style={styles.pillRow}>
              <NumberField
                label="Distance réelle de cette ligne"
                value={calibDistanceInput}
                onChangeValue={setCalibDistanceInput}
                suffix="m"
                placeholder="ex: 5"
              />
              <Button label="✓ Valider l'échelle" onPress={confirmerCalibration} />
            </View>
          )}

          {calibration && (
            <Text onPress={recalibrer} style={{ color: colors.secondary, fontSize: typography.sizes.sm }}>
              🔄 Recalibrer l'échelle (efface les murs tracés)
            </Text>
          )}

          {segments.length > 0 && (
            <>
              <Text style={{ color: colors.text, fontWeight: '700', marginTop: spacing.sm }}>
                🧱 Murs tracés ({segments.length})
              </Text>
              {segments.map((s, index) => (
                <View key={s.id} style={[styles.row, { backgroundColor: colors.card, borderRadius: radius.md, shadowColor: colors.cardShadow }]}>
                  <Text style={{ color: colors.text }}>Mur {index + 1}</Text>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatNumber(s.lengthMeters, 2)} m</Text>
                  <Text onPress={() => retirerSegment(s.id)} style={{ color: colors.danger }}>✕</Text>
                </View>
              ))}

              <Text style={{ color: colors.text, fontWeight: '700', marginTop: spacing.sm }}>
                Réglages communs pour ces murs
              </Text>
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
              <NumberField label="Hauteur des murs" value={hauteur} onChangeValue={setHauteur} suffix="m" placeholder="ex: 2,80" />
              <NumberField label="Épaisseur du joint" value={jointCm} onChangeValue={setJointCm} suffix="cm" />
              <Text style={{ color: colors.textMuted }}>Bourrage</Text>
              <View style={styles.pillRow}>
                <Pill label="Non bourré" active={!bourre} onPress={() => setBourre(false)} />
                <Pill label="Bourré" active={bourre} onPress={() => setBourre(true)} />
              </View>

              <Button
                label={`✅ Créer les ${segments.length} mur(s) tracé(s)`}
                onPress={creerLesMurs}
                loading={creating}
                big
              />
            </>
          )}

          {createdCount > 0 ? (
            <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={{ color: colors.success, fontWeight: '700' }}>
                {createdCount} mur(s) créé(s) à partir du plan.
              </Text>
              <Button label="Voir le devis du projet" onPress={() => navigation.navigate('ProjetDetail', { projectId })} />
            </View>
          ) : null}

          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
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
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
});
