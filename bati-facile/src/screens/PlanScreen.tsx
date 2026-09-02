import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
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

const ZOOM_LEVELS = [1, 1.5, 2, 3];
const VIEWPORT_HEIGHT = 420;

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
  const [zoom, setZoom] = useState(1);
  const [panMode, setPanMode] = useState(false);

  const [mode, setMode] = useState<Mode>('calibrer');
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
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
    setDragStart(null);
    setDragCurrent(null);
    setMode('calibrer');
    setZoom(1);
    setPanMode(false);
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

  // Tous les points sont mémorisés en coordonnées "de base" (zoom = 1), pour
  // rester cohérents quel que soit le niveau de zoom utilisé au moment du tracé.
  function toBase(raw: Point): Point {
    return { x: raw.x / zoom, y: raw.y / zoom };
  }
  function toScreen(base: Point): Point {
    return { x: base.x * zoom, y: base.y * zoom };
  }

  function handleGrant(e: GestureResponderEvent) {
    const base = toBase({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
    setDragStart(base);
    setDragCurrent(base);
  }

  function handleMove(e: GestureResponderEvent) {
    setDragCurrent(toBase({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }));
  }

  function handleRelease(e: GestureResponderEvent) {
    if (!dragStart) return;
    const end = toBase({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
    const start = dragStart;
    const pixelDistance = distance(start, end);
    setDragStart(null);
    setDragCurrent(null);

    if (pixelDistance < 4) return; // évite un tap accidentel sans réel glissé

    if (mode === 'calibrer') {
      setCalibrationDraft({ p1: start, p2: end, pixelDistance });
    } else if (calibration) {
      const lengthMeters = pixelDistance * calibration.scaleMPerPx;
      setSegments((prev) => [...prev, { id: generateId(), p1: start, p2: end, lengthMeters }]);
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
    setDragStart(null);
    setDragCurrent(null);
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
    if (h === undefined || h <= 0) return setError('⚠️ Entrez la hauteur des murs ci-dessus avant de créer.');
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

  const baseHeight = containerWidth > 0 ? containerWidth / imageAspect : 0;
  const contentWidth = containerWidth * zoom;
  const contentHeight = baseHeight * zoom;
  const drawColor = mode === 'calibrer' ? colors.warning : colors.primary;

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>📐 Relevé sur plan</Text>
      <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
        Téléversez une photo du plan, calibrez l'échelle avec une cote connue, puis tracez les murs en glissant le
        doigt d'un point à l'autre — leur longueur réelle est calculée automatiquement.
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

          <View style={styles.pillRow}>
            <Pill label="🖐 Déplacer / zoomer" active={panMode} onPress={() => setPanMode(true)} />
            <Pill label="✏️ Dessiner" active={!panMode} onPress={() => setPanMode(false)} />
            {ZOOM_LEVELS.map((z) => (
              <Pill key={z} label={`${z * 100}%`} active={zoom === z} onPress={() => setZoom(z)} />
            ))}
          </View>

          {panMode ? (
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
              Faites glisser l'image pour naviguer, puis repassez en mode "✏️ Dessiner" pour tracer.
            </Text>
          ) : !calibration ? (
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
              {calibrationDraft
                ? 'Entrez la distance réelle de la ligne tracée (ex: une cote indiquée sur le plan).'
                : "Faites glisser le doigt d'un point à l'autre d'une cote connue sur le plan."}
            </Text>
          ) : (
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
              Échelle : {formatNumber(calibration.realMeters, 2)} m sur {formatNumber(calibration.pixelDistance, 0)} px
              — glissez le doigt le long de chaque mur.
            </Text>
          )}

          <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {containerWidth > 0 && (
              <View style={{ height: Math.min(VIEWPORT_HEIGHT, contentHeight || VIEWPORT_HEIGHT), borderRadius: radius.md, overflow: 'hidden' }}>
                <ScrollView scrollEnabled={panMode} nestedScrollEnabled>
                  <ScrollView horizontal scrollEnabled={panMode} nestedScrollEnabled>
                    <View
                      style={{ width: contentWidth, height: contentHeight }}
                      onStartShouldSetResponder={() => !panMode}
                      onMoveShouldSetResponder={() => !panMode}
                      onResponderGrant={handleGrant}
                      onResponderMove={handleMove}
                      onResponderRelease={handleRelease}
                    >
                      <Image source={{ uri: imageUri }} style={{ width: contentWidth, height: contentHeight }} resizeMode="stretch" />
                      <Svg width={contentWidth} height={contentHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
                        {calibration && (
                          <>
                            <Line
                              x1={toScreen(calibration.p1).x} y1={toScreen(calibration.p1).y}
                              x2={toScreen(calibration.p2).x} y2={toScreen(calibration.p2).y}
                              stroke={colors.secondary} strokeWidth={3}
                            />
                            <Circle cx={toScreen(calibration.p1).x} cy={toScreen(calibration.p1).y} r={5} fill={colors.secondary} />
                            <Circle cx={toScreen(calibration.p2).x} cy={toScreen(calibration.p2).y} r={5} fill={colors.secondary} />
                          </>
                        )}
                        {segments.map((s) => {
                          const a = toScreen(s.p1);
                          const b = toScreen(s.p2);
                          return (
                            <React.Fragment key={s.id}>
                              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.primary} strokeWidth={3} />
                              <Circle cx={a.x} cy={a.y} r={4} fill={colors.primary} />
                              <Circle cx={b.x} cy={b.y} r={4} fill={colors.primary} />
                              <SvgText
                                x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8}
                                fill={colors.primary} fontSize={13} fontWeight="bold" textAnchor="middle"
                              >
                                {formatNumber(s.lengthMeters, 2)} m
                              </SvgText>
                            </React.Fragment>
                          );
                        })}
                        {dragStart && dragCurrent && (
                          <>
                            <Line
                              x1={toScreen(dragStart).x} y1={toScreen(dragStart).y}
                              x2={toScreen(dragCurrent).x} y2={toScreen(dragCurrent).y}
                              stroke={drawColor} strokeWidth={3} strokeDasharray="6,4"
                            />
                            <Circle cx={toScreen(dragStart).x} cy={toScreen(dragStart).y} r={5} fill={drawColor} />
                            <Circle cx={toScreen(dragCurrent).x} cy={toScreen(dragCurrent).y} r={5} fill={drawColor} />
                          </>
                        )}
                      </Svg>
                    </View>
                  </ScrollView>
                </ScrollView>
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

              {error ? (
                <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text>
              ) : null}

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

          {error && segments.length === 0 ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
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
