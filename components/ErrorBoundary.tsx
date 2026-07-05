import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface State {
  error: Error | null;
}

// Last-line-of-defense error boundary. Catches render-time crashes anywhere
// in the tree so the release APK doesn't white-screen a user out.
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Route through console.error so the Babel remove-console plugin keeps it
    // in prod. Wire Sentry/Bugsnag here later if you add crash reporting.
    // eslint-disable-next-line no-console
    console.error('[EasyReads] Uncaught render error:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>😔</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          The app hit an unexpected error. Try again — if it keeps happening,
          restart the app.
        </Text>
        <TouchableOpacity onPress={this.reset} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  emoji: { fontSize: 56, marginBottom: SPACING.sm },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.mutedText,
    textAlign: 'center',
    maxWidth: 320,
  },
  btn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});
