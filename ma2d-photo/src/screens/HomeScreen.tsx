import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAdminPinGate } from '@/components/AdminPinGate';
import ApartmentPicker from '@/components/ApartmentPicker';
import BigCameraButton from '@/components/BigCameraButton';
import BuildingGrid from '@/components/BuildingGrid';
import PendingUploadsBanner from '@/components/PendingUploadsBanner';
import PrimaryButton from '@/components/PrimaryButton';
import ProjectPicker from '@/components/ProjectPicker';
import RecentPhotoItem from '@/components/RecentPhotoItem';
import { useApartments } from '@/hooks/useApartments';
import { useAuth } from '@/hooks/useAuth';
import { useConnectivity } from '@/hooks/useConnectivity';
import { usePhotoQueue } from '@/hooks/usePhotoQueue';
import { useProjects } from '@/hooks/useProjects';
import { RootStackParamList } from '@/navigation/types';
import { CaptureContext, saveCapturedMedia } from '@/services/capture/saveCapturedMedia';
import { logger } from '@/services/logging/logger';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { USER_MESSAGES } from '@/utils/errorMessages';
import { MediaType, PhotoRecord } from '@/types';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/** How long a permission dialog may stay unanswered before we call it a hang. */
const PERMISSION_TIMEOUT_MS = 60000;
/** How long we wait for the gallery Activity to actually come up. */
const PICKER_OPEN_TIMEOUT_MS = 6000;

/**
 * Races a promise against a timeout so a native call that never resolves
 * (seen on some devices/permission states with expo-image-picker) fails
 * loudly instead of leaving the capture flow stuck on "Ouverture..." forever
 * with no way to recover short of force-closing the app.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Waits for the camera/gallery picker, failing fast ONLY when its Activity
 * never actually came up.
 *
 * A plain timeout can't be used here: launchCameraAsync doesn't resolve until
 * the user has finished shooting, so any fixed deadline would kill a 30-second
 * video or a carefully framed photo and throw the capture away. Once the
 * native Activity opens, our app leaves the foreground — so if AppState never
 * left "active" by the deadline, nothing opened and we're genuinely stuck;
 * if it did, we wait as long as the user needs.
 */
function launchWithOpenWatchdog<T>(launch: Promise<T>, timeoutMessage: string): Promise<T> {
  let leftForeground = false;
  const subscription = AppState.addEventListener('change', (state) => {
    if (state !== 'active') leftForeground = true;
  });

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!leftForeground) reject(new Error(timeoutMessage));
    }, PICKER_OPEN_TIMEOUT_MS);
    launch.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  }).finally(() => subscription.remove());
}

export default function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const isOnline = useConnectivity();
  const {
    projects,
    buildings,
    selectedProject,
    selectedBuilding,
    selectProject,
    selectBuilding,
    refreshBuildings,
  } = useProjects();
  const {
    recentPhotos,
    pendingCount,
    syncing,
    retryPhoto,
    discardPhoto,
    triggerSync,
    refresh: refreshQueue,
  } = usePhotoQueue();
  const { apartments, refreshApartments } = useApartments(selectedBuilding?.id ?? null);
  const { requireAdmin, promptElement } = useAdminPinGate();
  const [processing, setProcessing] = useState<'idle' | 'opening' | 'saving'>('idle');
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

  // Home stays mounted underneath the camera and Administration in the stack,
  // so its building list (OneDrive folder status, names) and its recent-files
  // list would otherwise go stale — refresh both every time Home regains
  // focus, which is also how a just-captured photo shows up immediately.
  useFocusEffect(
    useCallback(() => {
      refreshBuildings();
      refreshApartments();
      refreshQueue();
    }, [refreshBuildings, refreshApartments, refreshQueue])
  );

  // A previously selected apartment belongs to the previously selected
  // building — switching buildings without resetting this would silently
  // tag the next photo with the wrong (or a since-deleted) apartment.
  useEffect(() => {
    setSelectedApartmentId(null);
  }, [selectedBuilding?.id]);

  /** Where the next capture belongs, or null when no building is selected yet. */
  const captureContext = useCallback((): CaptureContext | null => {
    if (!selectedBuilding || !selectedProject) return null;
    const apartment = selectedApartmentId
      ? (apartments.find((a) => a.id === selectedApartmentId) ?? null)
      : null;
    return {
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      buildingId: selectedBuilding.id,
      buildingName: selectedBuilding.name,
      apartmentId: apartment?.id ?? null,
      apartmentName: apartment?.name ?? null,
    };
  }, [selectedProject, selectedBuilding, selectedApartmentId, apartments]);

  /**
   * Capture happens on our own camera screen rather than by launching the
   * phone's camera app: that external Activity never came back on the target
   * device, which is what left the app stuck on "Ouverture...".
   */
  const openCamera = useCallback(
    (mediaType: MediaType) => {
      const context = captureContext();
      if (!context) {
        Alert.alert('Bâtiment requis', 'Choisissez un bâtiment avant de continuer.');
        return;
      }
      navigation.navigate('Camera', {
        mode: mediaType,
        ...context,
        folderConfigured: !!selectedBuilding?.photoFolder.itemId,
      });
    },
    [captureContext, navigation, selectedBuilding]
  );

  const pickFromGallery = useCallback(async () => {
    const context = captureContext();
    if (!context) {
      Alert.alert('Bâtiment requis', 'Choisissez un bâtiment avant de continuer.');
      return;
    }

    setProcessing('opening');
    logger.info('Gallery pick requested', { buildingId: context.buildingId });

    try {
      // Check first — only call requestMediaLibraryPermissionsAsync (which can
      // pop a system dialog) when we don't already have access.
      const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = existing.granted
        ? existing
        : await withTimeout(
            ImagePicker.requestMediaLibraryPermissionsAsync(),
            PERMISSION_TIMEOUT_MS,
            'Délai dépassé en attendant la réponse de permission'
          );
      if (!permission.granted) {
        logger.warn('Permission galerie refusée', { permission });
        Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
        return;
      }

      const result = await launchWithOpenWatchdog(
        ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 }),
        "La galerie ne s'est pas ouverte"
      );

      if (result.canceled || !result.assets?.[0]) {
        logger.info('Sélection annulée par l’utilisateur');
        return;
      }

      setProcessing('saving');
      await saveCapturedMedia(result.assets[0].uri, 'photo', context);

      if (!selectedBuilding?.photoFolder.itemId) {
        Alert.alert('Fichier enregistré', USER_MESSAGES.FOLDER_NOT_CONFIGURED);
      } else if (!isOnline) {
        Alert.alert('Hors ligne', USER_MESSAGES.NO_INTERNET);
      }
    } catch (e) {
      logger.error('Échec de la sélection/préparation du fichier', { error: String(e) });
      Alert.alert('Erreur', "Le fichier n'a pas pu être préparé. Réessayez.");
    } finally {
      setProcessing('idle');
    }
  }, [captureContext, isOnline, selectedBuilding]);

  const confirmDiscard = useCallback(
    (photo: PhotoRecord) => {
      Alert.alert(
        'Retirer le fichier',
        `"${photo.fileName}" sera supprimé du téléphone sans être envoyé dans OneDrive. Cette action est définitive.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Retirer',
            style: 'destructive',
            onPress: () => {
              discardPhoto(photo.id).catch((e) =>
                logger.error('Échec du retrait du fichier', { error: String(e) })
              );
            },
          },
        ]
      );
    },
    [discardPhoto]
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentPhotos}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ProjectPicker projects={projects} selectedProject={selectedProject} onSelect={selectProject} />
            <BuildingGrid
              buildings={buildings}
              selectedBuildingId={selectedBuilding?.id ?? null}
              onSelect={selectBuilding}
            />

            {selectedBuilding && apartments.length > 0 && (
              <ApartmentPicker
                apartments={apartments}
                selectedApartmentId={selectedApartmentId}
                onSelect={setSelectedApartmentId}
              />
            )}

            <View style={styles.cameraArea}>
              <BigCameraButton onPress={() => openCamera('photo')} disabled={processing !== 'idle'} />
              {processing !== 'idle' && (
                <Text style={styles.processingText}>
                  {processing === 'opening' ? 'Ouverture...' : 'Enregistrement...'}
                </Text>
              )}
              <PrimaryButton
                label="Prendre une vidéo"
                icon="videocam-outline"
                variant="secondary"
                onPress={() => openCamera('video')}
                disabled={processing !== 'idle'}
                style={styles.galleryButton}
              />
              <PrimaryButton
                label="Choisir dans la galerie"
                icon="folder-open-outline"
                variant="secondary"
                onPress={pickFromGallery}
                disabled={processing !== 'idle'}
                style={styles.galleryButton}
              />
            </View>

            <PendingUploadsBanner
              pendingCount={pendingCount}
              syncing={syncing}
              isOnline={isOnline}
              onPress={triggerSync}
            />

            <View style={styles.recentHeader}>
              <Text style={typography.h2}>Photos et vidéos récentes</Text>
              {/* Administration is PIN-protected as a whole, not just its
                  create/delete actions. */}
              <Text
                onPress={() => requireAdmin(() => navigation.navigate('Admin'))}
                style={styles.adminLink}
              >
                <Ionicons name="settings-outline" size={15} color={colors.primary} /> Administration
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <RecentPhotoItem photo={item} onRetry={retryPhoto} onDiscard={confirmDiscard} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun fichier pour le moment.</Text>}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <Text onPress={signOut} style={styles.signOut}>
            Se déconnecter
          </Text>
        }
      />
      {promptElement}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 20, paddingBottom: 40 },
  header: { gap: 4 },
  cameraArea: { alignItems: 'center', marginVertical: 28, gap: 16 },
  processingText: { color: colors.primary, fontWeight: '700' },
  galleryButton: { width: '100%' },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  adminLink: { color: colors.primary, fontWeight: '700' },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
  signOut: { color: colors.textSecondary, textAlign: 'center', marginTop: 24, textDecorationLine: 'underline' },
});
