import React, { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { hasAdminPin, setAdminPin, verifyAdminPin } from '@/services/security/adminPin';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

import PrimaryButton from './PrimaryButton';

const MIN_PIN_LENGTH = 4;

/**
 * Gates a create/delete admin action behind a PIN. Call requireAdmin(action)
 * from any onPress instead of calling the action directly; render
 * promptElement once anywhere in the screen's JSX. The first time it's
 * used with no PIN configured yet, it asks the user to create one instead
 * of verifying — see adminPin.ts.
 */
export function useAdminPinGate() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'verify' | 'create'>('verify');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const actionRef = useRef<(() => void) | null>(null);

  const requireAdmin = useCallback((action: () => void) => {
    actionRef.current = action;
    setPin('');
    setConfirmPin('');
    setError(null);
    hasAdminPin().then((exists) => {
      setMode(exists ? 'verify' : 'create');
      setVisible(true);
    });
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    actionRef.current = null;
  }, []);

  const onSubmit = useCallback(async () => {
    try {
      if (mode === 'create') {
        if (pin.length < MIN_PIN_LENGTH) {
          setError(`Le code PIN doit contenir au moins ${MIN_PIN_LENGTH} chiffres.`);
          return;
        }
        if (pin !== confirmPin) {
          setError('Les deux codes ne correspondent pas.');
          return;
        }
        await setAdminPin(pin);
      } else {
        const ok = await verifyAdminPin(pin);
        if (!ok) {
          setError('Code PIN incorrect.');
          setPin('');
          return;
        }
      }
    } catch {
      // Reading/writing the secure store can fail on a locked or unusual
      // device — surface it here instead of silently doing nothing.
      setError('Le code PIN n’a pas pu être vérifié. Réessayez.');
      return;
    }
    const action = actionRef.current;
    setVisible(false);
    actionRef.current = null;
    action?.();
  }, [mode, pin, confirmPin]);

  const promptElement = (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={typography.h2}>{mode === 'create' ? 'Créer un code PIN admin' : 'Code PIN admin requis'}</Text>
          <Text style={styles.hint}>
            {mode === 'create'
              ? `Aucun code PIN n'est encore défini. Choisissez-en un (au moins ${MIN_PIN_LENGTH} chiffres) pour protéger la création et la suppression des projets, bâtiments et appartements.`
              : 'Entrez le code PIN administrateur pour continuer.'}
          </Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            placeholder="Code PIN"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={styles.input}
            autoFocus
          />
          {mode === 'create' && (
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
              label={mode === 'create' ? 'Créer et continuer' : 'Valider'}
              onPress={onSubmit}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return { requireAdmin, promptElement };
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
