import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { DeviceMotion } from 'expo-sensors';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { markOnboarded } from '../lib/onboarding';
import { usePro } from '../lib/purchases';
import { COLORS, HEADING_FONT } from '../sky/theme';

const FREE = [
  'Sky Align and the accuracy meter',
  'Bright stars and all 89 constellations',
  'Sun, Moon and planets',
  'Live camera view and red night mode',
  'Time travel, one hour either way',
];
const PRO = [
  '2,851 stars, down to the faint ones',
  '110 Messier galaxies, nebulae and clusters',
  'Tonight: what is up and the best time to look',
  'Time travel, twelve hours either way',
];

function Dots({ index }: { index: number }) {
  return (
    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i === index ? styles.dotOn : null]} />
      ))}
    </View>
  );
}

function Primary({ label, onPress, busy }: { label: string; onPress: () => void; busy?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      style={({ pressed }) => [styles.primary, { opacity: pressed || busy ? 0.7 : 1 }]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function Secondary({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.secondary} hitSlop={6}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

function ConstellationArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 334 300" accessibilityLabel="A constellation drawn as seven stars joined by lines">
      <Path d="M30 70 L100 50 L160 90 L215 85 L235 150 L300 175 L285 235 L225 215 L235 150" fill="none" stroke="#5E6C9C" strokeWidth={1.5} />
      <G fill={COLORS.text}>
        <Circle cx={30} cy={70} r={4} />
        <Circle cx={100} cy={50} r={5} />
        <Circle cx={160} cy={90} r={4} />
        <Circle cx={215} cy={85} r={5} />
        <Circle cx={300} cy={175} r={4} />
        <Circle cx={285} cy={235} r={5} />
        <Circle cx={225} cy={215} r={4} />
      </G>
      <Circle cx={235} cy={150} r={7} fill={COLORS.accent} />
      <Circle cx={235} cy={150} r={16} fill="none" stroke={COLORS.accent} strokeWidth={1.5} />
      <SvgText x={258} y={146} fill={COLORS.accent} fontSize={13} fontWeight="600">
        Dubhe
      </SvgText>
    </Svg>
  );
}

function AlignArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 334 330" accessibilityLabel="A targeting ring locked onto the Moon, with a full accuracy meter">
      <Circle cx={167} cy={150} r={46} fill="#E9E4D4" />
      <Circle cx={150} cy={135} r={9} fill="#C9C3B0" />
      <Circle cx={185} cy={165} r={12} fill="#C9C3B0" />
      <Circle cx={160} cy={175} r={5} fill="#C9C3B0" />
      <Circle cx={167} cy={150} r={74} fill="none" stroke={COLORS.accent} strokeWidth={2} />
      <Path d="M167 56v24M167 220v24M73 150h24M237 150h24" stroke={COLORS.accent} strokeWidth={2} strokeLinecap="round" />
      <SvgText x={167} y={275} textAnchor="middle" fill={COLORS.text} fontSize={15} fontWeight="600">
        Moon
      </SvgText>
      <Rect x={67} y={296} width={200} height={8} rx={4} fill="#232C4F" />
      <Rect x={67} y={296} width={176} height={8} rx={4} fill={COLORS.accent} />
      <SvgText x={167} y={324} textAnchor="middle" fill={COLORS.muted} fontSize={12}>
        Accuracy: locked
      </SvgText>
    </Svg>
  );
}

const PERMS = [
  { title: 'Location', note: '', body: 'To work out which stars are above you. It is used on your phone only.', icon: 'M14 25s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z M14 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z' },
  { title: 'Motion and compass', note: '', body: 'So the map follows wherever you point your phone.', icon: 'M14 3a11 11 0 1 0 0 22a11 11 0 1 0 0-22z M18 10l-2.5 6.5L9 19l2.5-6.5z' },
  { title: 'Camera', note: ' (optional)', body: 'To show the live sky behind the map. Nothing is recorded.', icon: 'M4 9h4l2-3h8l2 3h4v13H4z M14 11a4 4 0 1 0 0 8a4 4 0 1 0 0-8z' },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { openPaywall, isPro } = usePro();
  const [, requestCamera] = useCameraPermissions();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const art = Math.min(width - 56, height * 0.36);

  const finish = useCallback(async () => {
    await markOnboarded();
    router.replace('/');
  }, []);

  const askPermissions = useCallback(async () => {
    setBusy(true);
    // Each request is independent: a refusal or error on one must not block the others or the flow.
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {}
    try {
      if (await DeviceMotion.isAvailableAsync()) await DeviceMotion.requestPermissionsAsync();
    } catch {}
    try {
      await requestCamera();
    } catch {}
    setBusy(false);
    setStep(3);
  }, [requestCamera]);

  const seePro = useCallback(async () => {
    setBusy(true);
    await openPaywall();
    setBusy(false);
    await finish();
  }, [openPaywall, finish]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      {step === 0 && (
        <>
          <Text style={styles.brand}>Stargaze</Text>
          <View style={styles.art}>
            <ConstellationArt size={art} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.h1} accessibilityRole="header">
              The sky map that points the right way.
            </Text>
            <Text style={styles.body}>Hold your iPhone up and Stargaze names the stars, planets and constellations in front of you.</Text>
          </View>
          <View style={styles.actions}>
            <Primary label="Get started" onPress={() => setStep(1)} />
            <Dots index={0} />
          </View>
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.eyebrow}>Sky Align</Text>
          <View style={styles.art}>
            <AlignArt size={art} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.h1} accessibilityRole="header">
              Lock on in one tap.
            </Text>
            <Text style={styles.body}>Phone compasses drift. Point at the Moon or a bright star, tap Align, and every label snaps onto the real thing.</Text>
          </View>
          <View style={styles.actions}>
            <Primary label="Continue" onPress={() => setStep(2)} />
            <Dots index={1} />
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.eyebrow}>Before you look up</Text>
          <Text style={[styles.h1, { marginTop: 12 }]} accessibilityRole="header">
            Three things Stargaze asks for.
          </Text>
          <ScrollView style={{ flex: 1, marginTop: 20 }} contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
            {PERMS.map((p) => (
              <View key={p.title} style={styles.card}>
                <Svg width={28} height={28} viewBox="0 0 28 28" fill="none" stroke={COLORS.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d={p.icon} />
                </Svg>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.cardTitle}>
                    {p.title}
                    <Text style={{ color: COLORS.muted, fontWeight: '500' }}>{p.note}</Text>
                  </Text>
                  <Text style={styles.cardBody}>{p.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Primary label="Allow and continue" onPress={askPermissions} busy={busy} />
            <Secondary label="Explore by dragging instead" onPress={() => setStep(3)} />
            <Dots index={2} />
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.h1} accessibilityRole="header">
            What you get
          </Text>
          <Text style={[styles.body, { fontSize: 15, marginTop: 8 }]}>No ads in either. Works without a connection.</Text>
          <ScrollView style={{ flex: 1, marginTop: 16 }} contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
            <View style={styles.listCard}>
              <Text style={styles.listHead}>Free, forever</Text>
              {FREE.map((t) => (
                <View key={t} style={styles.li}>
                  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={COLORS.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M3 9.5l4 4 8-9" />
                  </Svg>
                  <Text style={styles.liText}>{t}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.listCard, { borderWidth: 1.5, borderColor: COLORS.accent }]}>
              <Text style={[styles.listHead, { color: COLORS.accent }]}>Stargaze Pro adds</Text>
              {PRO.map((t) => (
                <View key={t} style={styles.li}>
                  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={COLORS.accent} strokeWidth={2} strokeLinecap="round">
                    <Path d="M9 2v14M2 9h14" />
                  </Svg>
                  <Text style={styles.liText}>{t}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.actions}>
            {isPro ? (
              <Primary label="Start stargazing" onPress={finish} />
            ) : (
              <>
                <Primary label="See Pro options" onPress={seePro} busy={busy} />
                <Secondary label="Continue with free" onPress={finish} />
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 28 },
  brand: { color: COLORS.text, fontFamily: HEADING_FONT, fontSize: 20, letterSpacing: 0.4 },
  eyebrow: { color: COLORS.accent, fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: 12 },
  h1: { color: COLORS.text, fontFamily: HEADING_FONT, fontSize: 34, lineHeight: 38 },
  body: { color: COLORS.muted, fontSize: 17, lineHeight: 25 },
  actions: { alignItems: 'center', gap: 12, marginTop: 24 },
  primary: { alignSelf: 'stretch', height: 56, borderRadius: 16, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: COLORS.onAccent, fontSize: 17, fontWeight: '600' },
  secondary: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.dim },
  dotOn: { width: 22, backgroundColor: COLORS.accent },
  card: { flexDirection: 'row', gap: 16, padding: 18, borderRadius: 18, backgroundColor: COLORS.card },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  cardBody: { color: COLORS.muted, fontSize: 15, lineHeight: 21 },
  listCard: { padding: 18, borderRadius: 18, backgroundColor: COLORS.card, gap: 10 },
  listHead: { color: COLORS.muted, fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  li: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  liText: { flex: 1, color: COLORS.text, fontSize: 15, lineHeight: 20 },
});
