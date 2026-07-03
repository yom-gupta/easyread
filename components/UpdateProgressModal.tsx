import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONTS } from "../constants/theme";
import { Book } from "../context/ReadingContext";

interface UpdateProgressModalProps {
  visible: boolean;
  onClose: () => void;
  book: Book | null;
  onUpdate: (bookId: string, newPage: number) => void;
}

const { height: H } = Dimensions.get("window");

// ─── Page-stack config ───────────────────────────────────────────────────────
const MAX_LAYERS = 8;
const LAYER_ROTATIONS = ["3deg", "-2.5deg", "5deg", "-4deg", "6.5deg", "-5.5deg", "8deg", "-7deg"];
const LAYER_COLORS = ["#FDFCF9", "#FAF8F3", "#F7F4EE", "#F4F0E8", "#F0EBE0", "#EDE6D8", "#E9E0CF", "#E5DAC7"];

function getLayerCount(added: number) {
  if (added <= 0) return 1;
  return Math.min(added, MAX_LAYERS);
}
function getShadow(added: number) {
  if (added <= 10) return 0.08;
  return Math.min(0.08 + (added - 10) * 0.008, 0.35);
}

// ─── Component ───────────────────────────────────────────────────────────────
export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  visible, onClose, book, onUpdate,
}) => {
  const [pageInput, setPageInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Card animation — single value drives opacity + position
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(60)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;

  // Track whether modal was already open — prevents reset when `book` updates after onUpdate()
  const wasVisible = useRef(false);

  // Reset + play entry animation ONLY on open transition (visible: false → true)
  useEffect(() => {
    if (visible && book && !wasVisible.current) {
      // Mark as open
      wasVisible.current = true;

      cardOpacity.setValue(0);
      cardTranslateY.setValue(60);
      cardRotate.setValue(0);
      setPageInput("");
      setErrorMsg(null);

      // Entry: slide up + fade in
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 320,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0, tension: 120, friction: 10, useNativeDriver: true,
        }),
      ]).start();
    }

    // Mark as closed when modal hides
    if (!visible) {
      wasVisible.current = false;
    }
  }, [visible, book]);

  if (!book) return null;

  // Derived
  const parsed = parseInt(pageInput, 10);
  const addedPages = !isNaN(parsed) ? Math.max(0, parsed - book.pagesRead) : 0;
  const layerCount = getLayerCount(addedPages);
  const shadow = getShadow(addedPages);

  // Rotation interpolation (for exit)
  const rotateStr = cardRotate.interpolate({
    inputRange: [0, 1], outputRange: ["0deg", "12deg"],
  });

  const handleUpdate = () => {
    Keyboard.dismiss();
    const newPage = parseInt(pageInput, 10);
    if (isNaN(newPage)) { setErrorMsg("Please enter a valid page number."); return; }
    if (newPage < book.pagesRead) { setErrorMsg(`Cannot be less than current progress (${book.pagesRead}).`); return; }
    if (newPage > book.totalPages) { setErrorMsg(`Cannot exceed total pages (${book.totalPages}).`); return; }

    // Exit: slide down + rotate + fade
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0, duration: 380,
        easing: Easing.in(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: H * 0.55, duration: 380,
        easing: Easing.in(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(cardRotate, {
        toValue: 1, duration: 380,
        easing: Easing.in(Easing.quad), useNativeDriver: true,
      }),
    ]).start(() => {
      // Progress updates right after exit, then close
      onUpdate(book.bookId, newPage);
      onClose();
    });
  };

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* Dismiss tap area */}
        <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={onClose} />

        {/* ── Card stack ─────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.stackWrapper,
            {
              opacity: cardOpacity,
              shadowOpacity: shadow,
              transform: [{ translateY: cardTranslateY }, { rotate: rotateStr }],
            },
          ]}
        >
          {/* Behind-page layers */}
          {Array.from({ length: layerCount }).map((_, i) => {
            const li = layerCount - 1 - i;
            return (
              <View
                key={li}
                style={[
                  styles.layer,
                  {
                    backgroundColor: LAYER_COLORS[li] ?? "#E0D8C8",
                    transform: [{ rotate: LAYER_ROTATIONS[li] ?? "0deg" }],
                    opacity: 0.95 - li * 0.04,
                  },
                ]}
              />
            );
          })}

          {/* Front card */}
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Update Progress</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Book info */}
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle} numberOfLines={1}>"{book.title}"</Text>
              <Text style={styles.bookAuthor}>by {book.author}</Text>
              <Text style={styles.progress}>
                Current:{" "}
                <Text style={styles.highlight}>{book.pagesRead}</Text>
                {" "}/ {book.totalPages} p ({Math.round((book.pagesRead / book.totalPages) * 100)}%)
              </Text>
            </View>

            {/* Form */}
            <View>
              <Text style={styles.label}>Which page are you on now?</Text>

              <View style={styles.quickRow}>
                {[2, 5, 10].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={styles.quickBtn}
                    onPress={() => {
                      setPageInput(String(Math.min(book.pagesRead + n, book.totalPages)));
                      setErrorMsg(null);
                    }}
                  >
                    <Text style={styles.quickText}>+{n} p</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={pageInput}
                  onChangeText={t => { setPageInput(t); setErrorMsg(null); }}
                  placeholder={String(book.pagesRead)}
                  placeholderTextColor={COLORS.mutedText}
                  autoFocus
                />
                <Text style={styles.inputSuffix}>of {book.totalPages} pages</Text>
              </View>

              {addedPages > 0 && (
                <Text style={styles.hint}>
                  +{addedPages} page{addedPages !== 1 ? "s" : ""} added
                </Text>
              )}

              {errorMsg && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger ?? "#EF4444"} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                  <Text style={styles.saveText}>Save Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.overlay,
  },
  dismiss: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  },

  // Stack
  stackWrapper: {
    width: "90%",
    maxWidth: 360,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00000077",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 10,
  },
  layer: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0",
  },

  // Card
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, fontFamily: FONTS.serif },
  closeBtn: { padding: SPACING.xs },
  bookInfo: {
    marginBottom: SPACING.md, backgroundColor: "#FAF8F5",
    padding: SPACING.md, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  bookTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, fontFamily: FONTS.serif },
  bookAuthor: { fontSize: 12, color: COLORS.mutedText, marginTop: 1 },
  progress: { fontSize: 12, color: COLORS.text, marginTop: SPACING.sm },
  highlight: { fontWeight: "700", color: COLORS.accent },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.sm },
  quickRow: { flexDirection: "row", gap: 8, marginBottom: SPACING.md },
  quickBtn: {
    flex: 1, paddingVertical: 6,
    backgroundColor: "rgba(74,124,89,0.08)", borderRadius: 6,
    borderWidth: 1, borderColor: "rgba(74,124,89,0.15)", alignItems: "center",
  },
  quickText: { color: COLORS.accent, fontWeight: "700", fontSize: 12 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FAF8F5", borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: SPACING.md, height: 48, marginBottom: SPACING.sm,
  },
  input: { flex: 1, fontSize: 16, fontWeight: "600", color: COLORS.text, paddingVertical: 0 },
  inputSuffix: { fontSize: 12, color: COLORS.mutedText, marginLeft: SPACING.sm },
  hint: { fontSize: 11, color: COLORS.accent, fontWeight: "600", marginBottom: SPACING.xs, opacity: 0.85 },
  errorRow: { flexDirection: "row", alignItems: "center", marginTop: 2, marginBottom: SPACING.md },
  errorText: { color: COLORS.danger ?? "#EF4444", fontSize: 12, fontWeight: "500", marginLeft: 4 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1, height: 44, justifyContent: "center", alignItems: "center",
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#FFF",
  },
  cancelText: { color: COLORS.mutedText, fontWeight: "600", fontSize: 14 },
  saveBtn: {
    flex: 1.5, height: 44, backgroundColor: COLORS.accent,
    justifyContent: "center", alignItems: "center", borderRadius: 8,
  },
  saveText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },

});
