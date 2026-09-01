import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Props {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  style,
}: Props) {
  const backgroundColor =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.surface;
  const textColor = variant === 'secondary' ? colors.primary : colors.textOnPrimary;
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor, opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
          variant === 'secondary' && styles.secondaryBorder,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={20} color={textColor} style={styles.icon} />}
            <Text style={[typography.button, { color: textColor }]}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  icon: { marginRight: 10 },
  secondaryBorder: {
    borderWidth: 2,
    borderColor: '#0F2A43',
  },
});
