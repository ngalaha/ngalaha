import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bâti Facile</Text>
      <Text style={styles.subtitle}>
        Moteur de calcul (Phase 1) prêt — écrans à venir en Phase 2.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E3A',
  },
  subtitle: {
    fontSize: 14,
    color: '#5B6B62',
    textAlign: 'center',
  },
});
