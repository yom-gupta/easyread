import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useReading } from '../context/ReadingContext';

// Utility to generate an array of the last N dates (YYYY-MM-DD)
const getLastNDates = (n: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates.reverse(); // earliest first
};

interface BookHeatmapProps {
  bookId: string;
  days?: number; // number of days to display, default 30
}

export const BookHeatmap: React.FC<BookHeatmapProps> = ({ bookId, days = 30 }) => {
  const { bookReadLog } = useReading();
  const bookLog = bookReadLog[bookId] || {};

  const dates = getLastNDates(days);

  // Determine max pages read in a single day for this book (for color scaling)
  const maxPages = Math.max(...Object.values(bookLog), 0);

  const getColor = (pages: number) => {
    if (pages === 0) return '#e0e0e0';
    const intensity = maxPages ? pages / maxPages : 0;
    const s = (30 + Math.round(70 * intensity)) / 100;
    const l = (80 - Math.round(30 * intensity)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((180 / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (180 / 60 < 1) { r = c; g = x; b = 0; }
    else if (180 / 60 < 2) { r = x; g = c; b = 0; }
    else { r = 0; g = c; b = x; }
    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return (
    <View style={styles.grid}>
      {dates.map(date => {
        const pages = bookLog[date] ?? 0;
        return <View key={date} style={[styles.cell, { backgroundColor: getColor(pages) }]} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  cell: {
    width: 10,
    height: 10,
    margin: 1,
    borderRadius: 2,
  },
});
