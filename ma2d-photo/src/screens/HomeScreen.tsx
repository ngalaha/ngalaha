import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import BigCameraButton from '@/components/BigCameraButton';
import BuildingGrid from '@/components/BuildingGrid';
import PendingUploadsBanner from '@/components/PendingUploadsBanner';
import PrimaryButton from '@/components/PrimaryButton';
import ProjectPicker from '@/components/ProjectPicker';
import RecentPhotoItem from '@/components/RecentPhotoItem';
import { insertPhoto } from '@/database/photosRepository';
import { useAuth } from '@/hooks/useAuth';
import { useConnectivity } from '@/hooks/useConnectivity';
import { usePhotoQueue } from '@/hooks/usePhotoQueue';
import { useProjects } from '@/hooks/useProjects';
import { RootStackParamList } from '@/navigation/types';
import { persistLocalPhoto } from '@/services/storage/fileStorage';
import { compressPhoto, dateFolderFor, generateUniqueFileName } from '@/services/storage/imageProcessing';
import { runSync } from '@/services/upload/uploadQueueService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { generateId } from '@/utils/idUtils';
import { USER_MESSAGES } from '@/utils/errorMessages';
import { PhotoRecord } from '@/types';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

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
  const [processing, setProcessing] = useState<'idle' | 'preparing' | 'saving'>('idle');

  // Home stays mounted underneath Administration in the stack, so its
  // building list (OneDrive folder status, names) would otherwise go stale
  // after an edit made there — refresh it every time Home regains focus.
  useFocusEffect(
    useCallback(() => {
      refreshBuildings();
    }, [refreshBuildings])
  );

  const captureFrom = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (!selectedBuilding) {
        Alert.alert('Bâtiment requis', 'Choisissez un bâtiment avant de prendre une photo.');
        return;
      }

      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', "L'accès à l'appareil photo / à la galerie est nécessaire.");
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 1,
            });

      if (result.canceled || !result.assets?.[0]) return;

      try {
        setProcessing('preparing');
        const captureDate = new Date();
        const compressed = await compressPhoto(result.assets[0].uri);
        const fileName = await generateUniqueFileName(captureDate);

        setProcessing('saving');
        const { uri, sizeBytes } = await persistLocalPhoto(compressed.uri, fileName);

        const photo: PhotoRecord = {
          id: generateId(),
          projectId: selectedProject!.id,
          projectName: selectedProject!.name,
          buildingId: selectedBuilding.id,
          buildingName: selectedBuilding.name,
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

        if (!selectedBuilding.photoFolder.itemId) {
          Alert.alert('Photo enregistrée', USER_MESSAGES.FOLDER_NOT_CONFIGURED);
        } else if (!isOnline) {
          Alert.alert('Hors ligne', USER_MESSAGES.NO_INTERNET);
        }

        runSync();
      } catch (e) {
        Alert.alert('Erreur', "La photo n'a pas pu être préparée. Réessayez.");
      } finally {
        setProcessing('idle');
      }
    },
    [selectedBuilding, selectedProject, isOnline]
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

            <View style={styles.cameraArea}>
              <BigCameraButton onPress={() => captureFrom('camera')} disabled={processing !== 'idle'} />
              {processing !== 'idle' && (
                <Text style={styles.processingText}>
                  {processing === 'preparing' ? 'Préparation...' : 'Enregistrement...'}
                </Text>
              )}
              <PrimaryButton
                label="📁 Choisir dans la galerie"
                variant="secondary"
                onPress={() => captureFrom('gallery')}
                disabled={processing !== 'idle'}
                style={styles.galleryButton}
              />
            </View>

            <PendingUploadsBanner pendingCount={pendingCount} syncing={syncing} isOnline={isOnline} />

            <View style={styles.recentHeader}>
              <Text style={typography.h2}>Photos récentes</Text>
              <Text onPress={() => navigation.navigate('Admin')} style={styles.adminLink}>
                ⚙️ Administration
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <RecentPhotoItem photo={item} onRetry={retryPhoto} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucune photo pour le moment.</Text>}
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
