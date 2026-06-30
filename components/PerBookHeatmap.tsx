import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface MiniHeatmapProps {
  logData: Record<string, number>;
  days?: number;
}

export const MiniHeatmap: React.FC<MiniHeatmapProps> = ({ logData, days = 14 }) => {
  const getDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const cells = Array.from({ length: days }, (_, i) => {
    const dateStr = getDate(-(days - 1 - i));
    const pages = logData[dateStr] ?? 0;
    let color = '#E8E0D4';
    if (pages > 20) color = 'rgba(74, 124, 89, 0.95)';
    else if (pages > 10) color = 'rgba(74, 124, 89, 0.65)';
    else if (pages > 0) color = 'rgba(74, 124, 89, 0.35)';
    return { dateStr, color };
  });

  return (
    <View style={styles.row}>
      {cells.map(cell => (
        <View key={cell.dateStr} style={[styles.cell, { backgroundColor: cell.color }]} />
      ))}
    </View>
  );
};

interface PerBookHeatmapProps {
  logData: Record<string, number>;
  title?: string;
}

export const PerBookHeatmap: React.FC<PerBookHeatmapProps> = ({ logData, title = 'Reading Activity' }) => {
  const getDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const last35Days = Array.from({ length: 35 }, (_, i) => getDate(-(34 - i)));
  const heatmapData = last35Days.map(dateStr => ({
    dateStr,
    pages: logData[dateStr] ?? 0,
  }));

  const columns: typeof heatmapData[] = [];
  for (let i = 0; i < 5; i++) {
    columns.push(heatmapData.slice(i * 7, (i + 1) * 7));
  }

  const totalPages = Object.values(logData).reduce((s, v) => s + v, 0);
  const activeDays = Object.values(logData).filter(v => v > 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{activeDays} days · {totalPages} pages</Text>
      </View>
      <View style={styles.heatmapContainer}>
        <View style={styles.weekdayLabels}>
          <Text style={styles.weekdayText}>M</Text>
          <Text style={styles.weekdayText}>W</Text>
          <Text style={styles.weekdayText}>F</Text>
        </View>
        <View style={styles.heatmapGrid}>
          {columns.map((column, colIdx) => (
            <View key={colIdx} style={styles.heatmapColumn}>
              {column.map(day => {
                let color = '#F3F4F6';
                if (day.pages > 20) color = 'rgba(74, 124, 89, 0.95)';
                else if (day.pages > 10) color = 'rgba(74, 124, 89, 0.65)';
                else if (day.pages > 0) color = 'rgba(74, 124, 89, 0.3)';
                return (
                  <View key={day.dateStr} style={[styles.heatmapCell, { backgroundColor: color }]} />
                );
              })}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>Less</Text>
        {['#F3F4F6', 'rgba(74,124,89,0.3)', 'rgba(74,124,89,0.65)', 'rgba(74,124,89,0.95)'].map(c => (
          <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  meta: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  heatmapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekdayLabels: {
    marginRight: 6,
    gap: 12,
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 8.5,
    color: COLORS.mutedText,
    fontWeight: '700',
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  heatmapColumn: {
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 2,
    minHeight: 8,
    maxHeight: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 10,
  },
  legendLabel: {
    fontSize: 9,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 6,
  },
  cell: {
    flex: 1,
    height: 3,
    borderRadius: 1,
  },
});
