import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { RootStackParamList } from '@/navigation/types';
import { logger } from '@/services/logging/logger';
import { saveCapturedMedia } from '@/services/capture/saveCapturedMedia';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { USER_MESSAGES } from '@/utils/errorMessages';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

const MAX_VIDEO_SECONDS = 300;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * In-app camera. Deliberately does NOT hand off to the phone's camera app:
 * launching that external Activity never came back on the target device, so
 * the capture is done inside the app, where nothing can swallow it.
 */
export default function CameraScreen({ route, navigation }: Props) {
  const { mode, folderConfigured, ...context } = route.params;
  const isVideo = mode === 'video';

  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Ask for what this mode needs, once, as soon as the screen opens.
  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  useEffect(() => {
    if (isVideo && micPermission && !micPermission.granted && micPermission.canAskAgain) {
      requestMicPermission();
    }
  }, [isVideo, micPermission, requestMicPermission]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const save = async (uri: string) => {
    try {
      await saveCapturedMedia(uri, mode, context);
      if (!folderConfigured) {
        Alert.alert('Fichier enregistré', USER_MESSAGES.FOLDER_NOT_CONFIGURED);
      }
      navigation.goBack();
    } catch (e) {
      logger.error("Échec de l'enregistrement du fichier capturé", { mode, error: String(e) });
      Alert.alert('Erreur', "Le fichier n'a pas pu être enregistré. Réessayez.");
    }
  };

  const takePhoto = async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!picture?.uri) throw new Error('takePictureAsync returned no uri');
      await save(picture.uri);
    } catch (e) {
      logger.error('Échec de la prise de photo', { error: String(e) });
      Alert.alert('Erreur', "La photo n'a pas pu être prise. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    if (busy || recording || !cameraRef.current) return;
    setRecording(true);
    setElapsed(0);
    try {
      // Resolves only once stopRecording() is called or maxDuration is hit.
      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_VIDEO_SECONDS });
      setRecording(false);
      if (!video?.uri) throw new Error('recordAsync returned no uri');
      setBusy(true);
      await save(video.uri);
    } catch (e) {
      setRecording(false);
      logger.error("Échec de l'enregistrement vidéo", { error: String(e) });
      Alert.alert('Erreur', "La vidéo n'a pas pu être enregistrée. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const stopRecording = () => {
    if (!recording || !cameraRef.current) return;
    cameraRef.current.stopRecording();
  };

  // Only the camera itself is mandatory: a refused microphone falls back to
  // a silent recording (see startRecording) instead of blocking the screen.
  const permissionMissing = !cameraPermission?.granted;

  if (!cameraPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (permissionMissing) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
        <Text style={[typography.h2, styles.permissionTitle]}>Autorisation requise</Text>
        <Text style={styles.permissionText}>
          {cameraPermission.canAskAgain
            ? "L'accès à l'appareil photo est nécessaire pour documenter le chantier."
            : "L'accès à l'appareil photo a été refusé. Activez-le dans les réglages du téléphone pour continuer."}
        </Text>
        <PrimaryButton
          label={cameraPermission.canAskAgain ? 'Autoriser' : 'Ouvrir les réglages'}
          icon={cameraPermission.canAskAgain ? 'checkmark-circle-outline' : 'settings-outline'}
          onPress={() => {
            if (!cameraPermission.canAskAgain) {
              Linking.openSettings();
              return;
            }
            requestCameraPermission();
            if (isVideo) requestMicPermission();
          }}
          style={styles.permissionButton}
        />
        <Text onPress={() => navigation.goBack()} style={styles.cancelLink}>
          Annuler
        </Text>
      </View>
    );
  }

  const location = context.apartmentName
    ? `${context.buildingName} — ${context.apartmentName}`
    : `${context.buildingName} — Zone commune`;

  return (
    <View style={styles.container}>
      {/* The rest of the app is light, but this screen is a black preview. */}
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode={isVideo ? 'video' : 'picture'}
        // If the microphone was refused, record silently rather than refusing
        // to film at all — the picture is what documents the site.
        mute={!micPermission?.granted}
      />

      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconButton}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
        <View style={styles.locationPill}>
          <Text style={styles.locationText}>{location}</Text>
        </View>
        <Pressable
          onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
          hitSlop={12}
          style={styles.iconButton}
          disabled={recording}
        >
          <Ionicons name="camera-reverse-outline" size={26} color={recording ? '#FFFFFF60' : '#FFFFFF'} />
        </Pressable>
      </View>

      {recording && (
        <View style={styles.recordingPill}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>{formatElapsed(elapsed)}</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        {busy ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : isVideo ? (
          <Pressable
            onPress={recording ? stopRecording : startRecording}
            style={[styles.shutter, styles.shutterVideo]}
            hitSlop={8}
          >
            <View style={recording ? styles.stopSquare : styles.recordCircle} />
          </Pressable>
        ) : (
          <Pressable onPress={takePhoto} style={styles.shutter} hitSlop={8}>
            <View style={styles.shutterInner} />
          </Pressable>
        )}
        <Text style={styles.hint}>
          {isVideo
            ? recording
              ? 'Touchez pour arrêter'
              : 'Touchez pour filmer'
            : 'Touchez pour prendre la photo'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  permissionTitle: { marginTop: 16, marginBottom: 8, textAlign: 'center' },
  permissionText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  permissionButton: { marginTop: 24, alignSelf: 'stretch' },
  cancelLink: { color: colors.textSecondary, marginTop: 20, textDecorationLine: 'underline' },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconButton: { padding: 8, borderRadius: 20, backgroundColor: '#00000066' },
  locationPill: {
    flex: 1,
    backgroundColor: '#00000066',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  locationText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  recordingPill: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00000080',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  recordingText: { color: '#FFFFFF', fontWeight: '700' },
  bottomBar: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center', gap: 12 },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF' },
  shutterVideo: { borderColor: '#FFFFFF' },
  recordCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.danger },
  stopSquare: { width: 34, height: 34, borderRadius: 6, backgroundColor: colors.danger },
  hint: { color: '#FFFFFFCC', fontSize: 13, fontWeight: '600' },
});
