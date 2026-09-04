import React, { useCallback, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  hasAdminPin,
  isAdminSessionActive,
  markAdminVerified,
  setAdminPin,
  verifyAdminPin,
} from '@/services/security/adminPin';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

import PrimaryButton from './PrimaryButton';

const MIN_PIN_LENGTH = 4;

type Mode = 'verify' | 'create' | 'change';

/**
 * Gates a create/delete admin action behind a PIN. Call requireAdmin(action)
 * from any onPress instead of calling the action directly; render
 * promptElement once anywhere in the screen's JSX. The first time it's
 * used with no PIN configured yet, it asks the user to create one instead
 * of verifying — see adminPin.ts. promptPinChange() opens the same modal
 * to replace an existing PIN.
 */
export function useAdminPinGate() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>('verify');
  const [currentPin, setCurrentPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const actionRef = useRef<(() => void) | null>(null);

  const reset = useCallback(() => {
    setCurrentPin('');
    setPin('');
    setConfirmPin('');
    setError(null);
  }, []);

  const requireAdmin = useCallback(
    (action: () => void) => {
      // Already unlocked a moment ago (e.g. just entered Administration):
      // don't ask again for every action inside it.
      if (isAdminSessionActive()) {
        action();
        return;
      }
      actionRef.current = action;
      reset();
      hasAdminPin().then((exists) => {
        setMode(exists ? 'verify' : 'create');
        setVisible(true);
      });
    },
    [reset]
  );

  /**
   * Changes the PIN. The current one is asked for even inside an unlocked
   * session: an unattended phone is exactly how someone would lock the
   * real administrator out by setting a PIN only they know.
   */
  const promptPinChange = useCallback(() => {
    actionRef.current = () => Alert.alert('Code PIN modifié', 'Le nouveau code PIN est actif.');
    reset();
    hasAdminPin().then((exists) => {
      setMode(exists ? 'change' : 'create');
      setVisible(true);
    });
  }, [reset]);

  const close = useCallback(() => {
    setVisible(false);
    actionRef.current = null;
  }, []);

  const onSubmit = useCallback(async () => {
    try {
      if (mode === 'verify') {
        if (!(await verifyAdminPin(pin))) {
          setError('Code PIN incorrect.');
          setPin('');
          return;
        }
      } else {
        if (mode === 'change' && !(await verifyAdminPin(currentPin))) {
          setError('Code PIN actuel incorrect.');
          setCurrentPin('');
          return;
        }
        if (pin.length < MIN_PIN_LENGTH) {
          setError(`Le code PIN doit contenir au moins ${MIN_PIN_LENGTH} chiffres.`);
          return;
        }
        if (pin !== confirmPin) {
          setError('Les deux codes ne correspondent pas.');
          return;
        }
        await setAdminPin(pin);
      }
    } catch {
      // Reading/writing the secure store can fail on a locked or unusual
      // device — surface it here instead of silently doing nothing.
      setError('Le code PIN n’a pas pu être vérifié. Réessayez.');
      return;
    }
    markAdminVerified();
    const action = actionRef.current;
    setVisible(false);
    actionRef.current = null;
    action?.();
  }, [mode, currentPin, pin, confirmPin]);

  const title =
    mode === 'create'
      ? 'Créer un code PIN admin'
      : mode === 'change'
        ? 'Changer le code PIN admin'
        : 'Code PIN admin requis';

  const hint =
    mode === 'create'
      ? `Aucun code PIN n'est encore défini. Choisissez-en un (au moins ${MIN_PIN_LENGTH} chiffres) pour protéger la création et la suppression des projets, bâtiments et appartements.`
      : mode === 'change'
        ? 'Entrez le code PIN actuel, puis le nouveau code.'
        : 'Entrez le code PIN administrateur pour continuer.';

  const promptElement = (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={typography.h2}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>

          {mode === 'change' && (
            <TextInput
              value={currentPin}
              onChangeText={setCurrentPin}
              placeholder="Code PIN actuel"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              style={styles.input}
              autoFocus
            />
          )}

          <TextInput
            value={pin}
            onChangeText={setPin}
            placeholder={mode === 'verify' ? 'Code PIN' : 'Nouveau code PIN'}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={styles.input}
            autoFocus={mode !== 'change'}
          />

          {mode !== 'verify' && (
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirmer le code PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              style={styles.input}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.row}>
            <Pressable onPress={close} style={styles.cancel}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <PrimaryButton
              label={mode === 'verify' ? 'Valider' : mode === 'change' ? 'Changer' : 'Créer et continuer'}
              onPress={onSubmit}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return { requireAdmin, promptPinChange, promptElement };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  hint: { color: colors.textSecondary, fontSize: 13, marginTop: 8, marginBottom: 16, lineHeight: 18 },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 4,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  error: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12, marginTop: 4, alignItems: 'center' },
  cancel: { paddingVertical: 14, paddingHorizontal: 16 },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
  confirmButton: { flex: 1 },
});
