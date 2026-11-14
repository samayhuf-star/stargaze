import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, NIGHT_RED } from '../sky/theme';

type Props = { label: string; active?: boolean; night?: boolean; onPress: () => void; badge?: string };

export function Pill({ label, active, night, onPress, badge }: Props) {
  const accent = night ? NIGHT_RED.accent : COLORS.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.pill,
        { borderColor: active ? accent : COLORS.panelBorder, backgroundColor: active ? `${accent}33` : COLORS.panel, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.text, { color: active ? accent : COLORS.text }]}>{label}</Text>
      {badge ? <Text style={[styles.badge, { color: accent }]}>{badge}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  text: { fontSize: 13, fontWeight: '600' },
  badge: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
