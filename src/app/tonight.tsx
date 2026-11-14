import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useObserver } from '../lib/location';
import { usePro } from '../lib/purchases';
import { tonightPlanner } from '../sky/engine';
import { COLORS } from '../sky/theme';

const fmt = (d: Date | null) => (d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—');

export default function Tonight() {
  const { isPro, openPaywall } = usePro();
  const { observer } = useObserver();
  const rows = useMemo(() => tonightPlanner(new Date(), observer), [observer]);

  if (!isPro) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Tonight is a Pro feature</Text>
        <Text style={styles.muted}>See when the Moon and every planet rise and set where you are.</Text>
        <Pressable style={styles.button} onPress={async () => (await openPaywall()) || router.back()}>
          <Text style={styles.buttonText}>See Pro</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={styles.muted}>Next 24 hours for your location. Times are in your local time zone.</Text>
      {rows.map((r) => (
        <View key={r.name} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{r.name}</Text>
            <Text style={styles.muted}>
              {r.alt > 0 ? `Up now, ${r.alt.toFixed(0)}° high` : 'Below the horizon'} · mag {r.mag.toFixed(1)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.time}>Rises {fmt(r.riseUtc)}</Text>
            <Text style={styles.time}>Sets {fmt(r.setUtc)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080c1a' },
  center: { flex: 1, backgroundColor: '#080c1a', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  muted: { color: COLORS.muted, fontSize: 13, textAlign: 'left' },
  row: { flexDirection: 'row', backgroundColor: COLORS.panel, borderRadius: 14, borderWidth: 1, borderColor: COLORS.panelBorder, padding: 14, gap: 10 },
  name: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  time: { color: COLORS.text, fontSize: 13 },
  button: { backgroundColor: COLORS.accent, borderRadius: 22, paddingHorizontal: 26, paddingVertical: 12 },
  buttonText: { color: '#04101f', fontWeight: '800', fontSize: 15 },
});
