import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import ApartmentPicker from '@/components/ApartmentPicker';
import BigCameraButton from '@/components/BigCameraButton';
import BuildingGrid from '@/components/BuildingGrid';
import PendingUploadsBanner from '@/components/PendingUploadsBanner';
import PrimaryButton from '@/components/PrimaryButton';
import ProjectPicker from '@/components/ProjectPicker';
import RecentPhotoItem from '@/components/RecentPhotoItem';
import { insertPhoto } from '@/database/photosRepository';
import { useApartments } from '@/hooks/useApartments';
import { useAuth } from '@/hooks/useAuth';
import { useConnectivity } from '@/hooks/useConnectivity';
import { usePhotoQueue } from '@/hooks/usePhotoQueue';
import { useProjects } from '@/hooks/useProjects';
import { RootStackParamList } from '@/navigation/types';
import { logger } from '@/services/logging/logger';
import { persistLocalPhoto } from '@/services/storage/fileStorage';
import { compressPhoto, dateFolderFor, generateUniqueFileName } from '@/services/storage/imageProcessing';
import { runSync } from '@/services/upload/uploadQueueService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { generateId } from '@/utils/idUtils';
import { USER_MESSAGES } from '@/utils/errorMessages';
import { sanitizeOneDriveSegment } from '@/utils/oneDriveNaming';
import { MediaType, PhotoRecord } from '@/types';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/** How long a permission dialog may stay unanswered before we call it a hang. */
const PERMISSION_TIMEOUT_MS = 60000;
/** How long we wait for the camera/gallery Activity to actually come up. */
const PICKER_OPEN_TIMEOUT_MS = 12000;

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

/** File extension from a local/picker URI (without the leading dot), or `fallback` if none is found. */
function extensionFromUri(uri: string, fallback: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? match[1].toLowerCase() : fallback;
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
  const { recentPhotos, pendingCount, syncing, retryPhoto } = usePhotoQueue();
  const { apartments, refreshApartments } = useApartments(selectedBuilding?.id ?? null);
  const [processing, setProcessing] = useState<'idle' | 'opening' | 'preparing' | 'saving'>('idle');
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

  // Home stays mounted underneath Administration in the stack, so its
  // building list (OneDrive folder status, names) would otherwise go stale
  // after an edit made there — refresh it every time Home regains focus.
  useFocusEffect(
    useCallback(() => {
      refreshBuildings();
      refreshApartments();
    }, [refreshBuildings, refreshApartments])
  );

  // A previously selected apartment belongs to the previously selected
  // building — switching buildings without resetting this would silently
  // tag the next photo with the wrong (or a since-deleted) apartment.
  useEffect(() => {
    setSelectedApartmentId(null);
  }, [selectedBuilding?.id]);

  const captureFrom = useCallback(
    async (source: 'camera' | 'gallery', mediaType: MediaType = 'photo') => {
      if (!selectedBuilding) {
        Alert.alert('Bâtiment requis', 'Choisissez un bâtiment avant de continuer.');
        return;
      }

      setProcessing('opening');
      logger.info('Capture requested', { source, mediaType, buildingId: selectedBuilding.id });

      try {
        // Check first — only call request*PermissionsAsync (which can pop a system
        // dialog and briefly steal window focus) when we don't already have access.
        const existing =
          source === 'camera'
            ? await ImagePicker.getCameraPermissionsAsync()
            : await ImagePicker.getMediaLibraryPermissionsAsync();
        const permission = existing.granted
          ? existing
          : await withTimeout(
              source === 'camera'
                ? ImagePicker.requestCameraPermissionsAsync()
                : ImagePicker.requestMediaLibraryPermissionsAsync(),
              PERMISSION_TIMEOUT_MS,
              'Délai dépassé en attendant la réponse de permission'
            );
        if (!permission.granted) {
          logger.warn('Permission refusée pour la capture', { source, permission });
          Alert.alert('Permission refusée', "L'accès à l'appareil photo / à la galerie est nécessaire.");
          return;
        }

        const pickerMediaTypes =
          mediaType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images;

        const result = await launchWithOpenWatchdog(
          source === 'camera'
            ? ImagePicker.launchCameraAsync({
                mediaTypes: pickerMediaTypes,
                quality: 1,
                // Keeps a forgotten running recording from producing a
                // multi-gigabyte file; 5 min is far beyond any site clip.
                ...(mediaType === 'video' ? { videoMaxDuration: 300 } : {}),
              })
            : ImagePicker.launchImageLibraryAsync({ mediaTypes: pickerMediaTypes, quality: 1 }),
          mediaType === 'video'
            ? "La caméra vidéo ne s'est pas ouverte"
            : "L'appareil photo / la galerie ne s'est pas ouvert"
        );

        if (result.canceled || !result.assets?.[0]) {
          logger.info('Capture annulée par l’utilisateur', { source, mediaType });
          return;
        }

        setProcessing('preparing');
        const captureDate = new Date();
        const asset = result.assets[0];
        const selectedApartment = selectedApartmentId
          ? (apartments.find((a) => a.id === selectedApartmentId) ?? null)
          : null;
        const apartmentPrefix = selectedApartment ? sanitizeOneDriveSegment(selectedApartment.name) : undefined;

        // Photos get resized/re-encoded for a predictable size and format;
        // videos are used as captured — expo-image-manipulator is image-only,
        // and re-encoding video on-device is far too slow for this app's needs.
        const sourceUri = mediaType === 'video' ? asset.uri : (await compressPhoto(asset.uri)).uri;
        const extension = mediaType === 'video' ? extensionFromUri(asset.uri, 'mp4') : 'jpg';
        const fileName = generateUniqueFileName(captureDate, apartmentPrefix, extension);

        setProcessing('saving');
        const { uri, sizeBytes } = await persistLocalPhoto(sourceUri, fileName);

        const photo: PhotoRecord = {
          id: generateId(),
          projectId: selectedProject!.id,
          projectName: selectedProject!.name,
          buildingId: selectedBuilding.id,
          buildingName: selectedBuilding.name,
          apartmentId: selectedApartment?.id ?? null,
          apartmentName: selectedApartment?.name ?? null,
          mediaType,
          fileName,
          localUri: uri,
          capturedAt: captureDate.toISOString(),
          dateFolder: dateFolderFor(captureDate),
          status: 'PENDING',
          attempts: 0,
          lastError: null,
          uploadedAt: null,
          remoteItemId: null,
          fileSizeBytes: sizeBytes,
        };
        insertPhoto(photo);
        logger.info('Media captured', { fileName, mediaType, buildingId: selectedBuilding.id });

        if (!selectedBuilding.photoFolder.itemId) {
          Alert.alert('Fichier enregistré', USER_MESSAGES.FOLDER_NOT_CONFIGURED);
        } else if (!isOnline) {
          Alert.alert('Hors ligne', USER_MESSAGES.NO_INTERNET);
        }

        runSync();
      } catch (e) {
        logger.error('Échec de la capture/préparation du fichier', { source, mediaType, error: String(e) });
        Alert.alert('Erreur', "Le fichier n'a pas pu être préparé. Réessayez.");
      } finally {
        setProcessing('idle');
      }
    },
    [selectedBuilding, selectedProject, isOnline, selectedApartmentId, apartments]
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
              <BigCameraButton onPress={() => captureFrom('camera', 'photo')} disabled={processing !== 'idle'} />
              {processing !== 'idle' && (
                <Text style={styles.processingText}>
                  {processing === 'opening'
                    ? 'Ouverture...'
                    : processing === 'preparing'
                      ? 'Préparation...'
                      : 'Enregistrement...'}
                </Text>
              )}
              <PrimaryButton
                label="Filmer une vidéo"
                icon="videocam-outline"
                variant="secondary"
                onPress={() => captureFrom('camera', 'video')}
                disabled={processing !== 'idle'}
                style={styles.galleryButton}
              />
              <PrimaryButton
                label="Choisir dans la galerie"
                icon="folder-open-outline"
                variant="secondary"
                onPress={() => captureFrom('gallery', 'photo')}
                disabled={processing !== 'idle'}
                style={styles.galleryButton}
              />
            </View>

            <PendingUploadsBanner pendingCount={pendingCount} syncing={syncing} isOnline={isOnline} />

            <View style={styles.recentHeader}>
              <Text style={typography.h2}>Photos et vidéos récentes</Text>
              <Text onPress={() => navigation.navigate('Admin')} style={styles.adminLink}>
                <Ionicons name="settings-outline" size={15} color={colors.primary} /> Administration
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <RecentPhotoItem photo={item} onRetry={retryPhoto} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun fichier pour le moment.</Text>}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <Text onPress={signOut} style={styles.signOut}>
            Se déconnecter
          </Text>
        }
      />
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
