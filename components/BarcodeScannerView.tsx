import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { haptics } from '../utils/haptics';

// expo-camera is required at runtime so the module can be missing in dev
// (before native rebuild) without crashing the whole modal.
let CameraModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CameraModule = require('expo-camera');
} catch { CameraModule = null; }

interface Props {
  active: boolean;                              // fully mounted (tab visible)
  onDetected: (isbn: string) => void;            // fires once per unique scan
  onSwitchToManual?: () => void;
}

// ISBN-10/13 sanity check — books use EAN-13 barcodes prefixed 978/979.
const looksLikeIsbn = (raw: string): boolean => {
  const s = raw.replace(/[^0-9Xx]/g, '');
  if (s.length === 13) return s.startsWith('978') || s.startsWith('979');
  if (s.length === 10) return true;
  return false;
};

export const BarcodeScannerView: React.FC<Props> = ({ active, onDetected, onSwitchToManual }) => {
  const [permission, requestPermission] = CameraModule?.useCameraPermissions
    ? CameraModule.useCameraPermissions()
    : [null, async () => null];
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reticle pulse animation.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  // Module missing (dev before rebuild). Show a helpful placeholder.
  if (!CameraModule) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="camera-outline" size={40} color={COLORS.border} />
        <Text style={styles.emptyTitle}>Scanner needs a rebuild</Text>
        <Text style={styles.emptySub}>
          Camera scanning uses a native module. Run{'\n'}
          <Text style={styles.mono}>npx expo prebuild --clean</Text>{'\n'}
          then rebuild the app to enable this.
        </Text>
        {onSwitchToManual && (
          <TouchableOpacity style={styles.altBtn} onPress={onSwitchToManual}>
            <Text style={styles.altBtnText}>Enter details manually</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Permission still loading.
  if (!permission) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  // Permission not granted — offer the ask.
  if (!permission.granted) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="camera-outline" size={32} color={COLORS.accent} />
        </View>
        <Text style={styles.emptyTitle}>Camera access needed</Text>
        <Text style={styles.emptySub}>
          Point at the barcode on the back of a book — usually a 13-digit ISBN — and we'll fill in the rest.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={async () => {
            const res = await requestPermission();
            if (res && !res.granted && !res.canAskAgain) Linking.openSettings();
          }}
        >
          <Ionicons name="camera" size={16} color={COLORS.white} />
          <Text style={styles.primaryBtnText}>Enable camera</Text>
        </TouchableOpacity>
        {onSwitchToManual && (
          <TouchableOpacity style={styles.altBtn} onPress={onSwitchToManual}>
            <Text style={styles.altBtnText}>Enter details manually</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const { CameraView } = CameraModule;

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!data) return;
    if (data === lastCode) return; // cooldown for the same code
    if (!looksLikeIsbn(data)) return; // ignore non-book barcodes
    setLastCode(data);
    haptics.success();
    onDetected(data.replace(/[^0-9Xx]/g, ''));

    // Re-arm after 2s so a user can rescan intentionally.
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => setLastCode(null), 2000);
  };

  const reticleScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const reticleOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={active ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
      />

      {/* Dim overlay with a hole cutout for the reticle. Four rects around
          the center — simplest cross-platform "mask" without extra deps. */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddle}>
        <View style={styles.overlaySide} />
        <Animated.View
          style={[
            styles.reticle,
            { transform: [{ scale: reticleScale }], opacity: reticleOpacity },
          ]}
        >
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <View style={styles.laser} />
        </Animated.View>
        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom}>
        <View style={styles.hintPill}>
          <Ionicons name="barcode-outline" size={14} color={COLORS.white} />
          <Text style={styles.hintText}>Line up the barcode on the back cover</Text>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setTorch(t => !t)}
            accessibilityLabel="Toggle flashlight"
          >
            <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={20} color={COLORS.white} />
          </TouchableOpacity>
          {onSwitchToManual && (
            <TouchableOpacity style={styles.controlBtn} onPress={onSwitchToManual}>
              <Ionicons name="create-outline" size={18} color={COLORS.white} />
              <Text style={styles.controlBtnText}>Type it instead</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const RETICLE_W = 260;
const RETICLE_H = 150;
const OVERLAY = 'rgba(0,0,0,0.72)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 440,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  overlayTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: '30%', backgroundColor: OVERLAY },
  overlayMiddle: { position: 'absolute', top: '30%', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  overlaySide:   { flex: 1, height: RETICLE_H, backgroundColor: OVERLAY },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, top: `${30}%`, marginTop: RETICLE_H, backgroundColor: OVERLAY, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: SPACING.lg, gap: SPACING.md },

  reticle: {
    width: RETICLE_W,
    height: RETICLE_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: COLORS.accent,
  },
  cornerTL: { top: 0, left: 0,  borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0,  borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  laser: {
    width: '85%',
    height: 2,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    opacity: 0.9,
  },

  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  hintText: { color: COLORS.white, fontSize: 12, fontFamily: FONTS.medium },
  controlRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  controlBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },

  // ── Non-camera states ────────────────────────────────
  emptyState: {
    minHeight: 380,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: 'rgba(74,124,89,0.04)',
    borderRadius: 16,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(74,124,89,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, textAlign: 'center' },
  emptySub: { fontSize: 13, color: COLORS.mutedText, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  mono: { fontFamily: 'Courier', fontWeight: '600', color: COLORS.text },
  primaryBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    backgroundColor: COLORS.accent,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  altBtn: { padding: 8 },
  altBtnText: { color: COLORS.accent, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
