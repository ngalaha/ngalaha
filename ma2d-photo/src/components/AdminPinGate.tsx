import React, { useCallback, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  hasAdminPin,
  isAdminSessionActive,
  markAdminVerified,
  setAdminPin,
  verifyAdminPin,
} from '@/services/security/adminPin';
import { useTranslation } from '@/i18n/I18nContext';
import { translate } from '@/i18n/translate';
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
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
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
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
    actionRef.current = () => Alert.alert(translate('pin.changed.title'), translate('pin.changed.body'));
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
          setError(translate('pin.wrong'));
          setPin('');
          return;
        }
      } else {
        if (mode === 'change' && !(await verifyAdminPin(currentPin))) {
          setError(translate('pin.wrongCurrent'));
          setCurrentPin('');
          return;
        }
        if (pin.length < MIN_PIN_LENGTH) {
          setError(`Le code PIN doit contenir au moins ${MIN_PIN_LENGTH} chiffres.`);
          return;
        }
        if (pin !== confirmPin) {
          setError(translate('pin.mismatch'));
          return;
        }
        await setAdminPin(pin);
      }
    } catch {
      // Reading/writing the secure store can fail on a locked or unusual
      // device — surface it here instead of silently doing nothing.
      setError(translate('pin.checkFailed'));
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
      ? t('pin.title.create')
      : mode === 'change'
        ? t('pin.title.change')
        : t('pin.title.verify');

  const hint =
    mode === 'create'
      ? t('pin.body.create', { min: MIN_PIN_LENGTH })
      : mode === 'change'
        ? t('pin.body.change')
        : t('pin.body.verify');

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
              placeholder={t('pin.placeholder.current')}
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
            placeholder={
              mode === 'verify' ? t('pin.placeholder.pin') : t('pin.placeholder.new')
            }
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
              placeholder={t('pin.placeholder.confirm')}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              style={styles.input}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.row}>
            <Pressable onPress={close} style={styles.cancel}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <PrimaryButton
              label={
                mode === 'verify'
                  ? t('pin.action.verify')
                  : mode === 'change'
                    ? t('pin.action.change')
                    : t('pin.action.create')
              }
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
