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
    if (pages === 0) return '#e0e0e0'; // no activity
    // simple gradient from light teal to deep teal
    const intensity = maxPages ? pages / maxPages : 0;
    const hue = 180; // teal
    const saturation = 30 + Math.round(70 * intensity);
    const lightness = 80 - Math.round(30 * intensity);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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
