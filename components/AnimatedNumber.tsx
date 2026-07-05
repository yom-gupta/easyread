import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface Props {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  formatter?: (n: number) => string;
  prefix?: string;
  suffix?: string;
}

// Count-up tween for any numeric display (streak, XP, pages read).
// Uses a manual RAF loop rather than Animated because we need the actual
// numeric value to render in a <Text>.
export const AnimatedNumber: React.FC<Props> = ({
  value,
  duration = 700,
  style,
  formatter,
  prefix = '',
  suffix = '',
}) => {
  const [display, setDisplay] = useState(value);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === display) return;
    fromRef.current = display;
    startRef.current = null;

    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / duration);
      // easeOutCubic — snappy but soft landing.
      const eased = 1 - Math.pow(1 - p, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(p >= 1 ? value : next);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const rendered = formatter
    ? formatter(display)
    : String(Math.round(display));

  return <Text style={style}>{prefix}{rendered}{suffix}</Text>;
};
