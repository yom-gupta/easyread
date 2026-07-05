import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import LottieView from 'lottie-react-native';

// The two dotLottie files. Fire = active streak (logged today), Grey Fire =
// dormant / at-risk (haven't logged today yet).
const FIRE_SRC = require('../assets/animations/Fire.lottie');
const GREY_SRC = require('../assets/animations/Grey Fire.lottie');

interface Props {
  size?: number;
  hasLoggedToday: boolean;
  style?: StyleProp<ViewStyle>;
}

// Force a remount when hasLoggedToday flips via the `key` prop — this both
// swaps the source AND resets the animation cleanly (avoids the "runs once
// then stops" bug seen when re-using the same LottieView instance).
export const StreakFlame: React.FC<Props> = ({ size = 24, hasLoggedToday, style }) => (
  <View style={[{ width: size, height: size }, style]}>
    <LottieView
      key={hasLoggedToday ? 'fire' : 'grey'}
      source={hasLoggedToday ? FIRE_SRC : GREY_SRC}
      autoPlay
      loop={true}
      resizeMode="cover"
      style={styles.lottie}
    />
  </View>
);

const styles = StyleSheet.create({
  lottie: { width: '100%', height: '100%' },
});
