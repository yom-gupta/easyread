import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { createUserProfile, calculateAge, type UserProfileData } from '../services/firebase/userProfileService';

const { width } = Dimensions.get('window');

interface SignUpFormScreenProps {
  uid: string;
  defaultDisplayName: string;
  defaultEmail: string;
  onComplete: (uid: string) => void;
  onError: (message: string) => void;
}

const GENDER_OPTIONS = [
  { value: 'male' as const, label: 'Male' },
  { value: 'female' as const, label: 'Female' },
  { value: 'other' as const, label: 'Other' },
  { value: 'prefer_not_to_say' as const, label: 'Prefer not to say' },
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

export const SignUpFormScreen: React.FC<SignUpFormScreenProps> = ({
  uid,
  defaultDisplayName,
  defaultEmail,
  onComplete,
  onError,
}) => {
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [email] = useState(defaultEmail);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [gender, setGender] = useState<UserProfileData['gender'] | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getDateString = (): string | null => {
    if (selectedDay && selectedMonth && selectedYear) {
      const m = String(selectedMonth).padStart(2, '0');
      const d = String(selectedDay).padStart(2, '0');
      return `${selectedYear}-${m}-${d}`;
    }
    return null;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.name = 'Name is required';
    }

    const dateStr = getDateString();
    if (!dateStr) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const age = calculateAge(dateStr);
      if (age < 0 || age > 150) {
        newErrors.dob = 'Please enter a valid date of birth';
      }
    }

    if (!gender) {
      newErrors.gender = 'Please select your gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 3, tension: 300, useNativeDriver: true }),
    ]).start();

    setLoading(true);
    try {
      const dateStr = getDateString()!;
      const age = calculateAge(dateStr);

      const profileData: UserProfileData = {
        email,
        displayName: displayName.trim(),
        dateOfBirth: dateStr,
        age,
        gender: gender!,
        authProvider: 'email' as const,
      };

      await createUserProfile(uid, profileData);
      onComplete(uid);
    } catch (err: any) {
      onError(err.message || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateLabel = (): string => {
    if (selectedDay && selectedMonth && selectedYear) {
      return `${MONTHS[selectedMonth - 1]} ${selectedDay}, ${selectedYear}`;
    }
    return 'Select date of birth';
  };

  const getGenderLabel = (): string => {
    if (gender) {
      const option = GENDER_OPTIONS.find(g => g.value === gender);
      return option?.label || 'Select gender';
    }
    return 'Select gender';
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerIcon}>
              <Ionicons name="person-add" size={28} color={COLORS.accent} />
            </View>
            <Text style={styles.headerTitle}>Complete Your Profile</Text>
            <Text style={styles.headerSubtitle}>
              Tell us a bit about yourself to personalize your reading experience.
            </Text>
          </View>

          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Ionicons name="person-outline" size={18} color={COLORS.mutedText} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={COLORS.mutedText}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Email Field (read-only) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={18} color={COLORS.mutedText} />
              <TextInput
                style={styles.input}
                value={email}
                editable={false}
                selectTextOnFocus={false}
              />
              <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={[styles.inputContainer, styles.datePickerTrigger, errors.dob && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color={COLORS.mutedText} />
              <Text
                style={[
                  styles.dateText,
                  !selectedDay && styles.placeholderText,
                ]}
              >
                {formatDateLabel()}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.mutedText} />
            </TouchableOpacity>
            {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <TouchableOpacity
              style={[styles.inputContainer, errors.gender && styles.inputError]}
              onPress={() => setShowGenderPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="male-female-outline" size={18} color={COLORS.mutedText} />
              <Text
                style={[
                  styles.dateText,
                  !gender && styles.placeholderText,
                ]}
              >
                {getGenderLabel()}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.mutedText} />
            </TouchableOpacity>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          {/* Submit Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 24 }}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating Profile...' : 'Get Started'}
              </Text>
              {!loading && (
                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </Animated.View>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerRow}>
              {/* Month */}
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {MONTHS.map((month, idx) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.pickerItem,
                      selectedMonth === idx + 1 && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedMonth(idx + 1)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedMonth === idx + 1 && styles.pickerItemTextSelected,
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Day */}
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerItem,
                      selectedDay === day && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedDay === day && styles.pickerItemTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Year */}
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {YEARS.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerItem,
                      selectedYear === year && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.pickerItemTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalConfirmText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal visible={showGenderPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.genderModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  gender === option.value && styles.genderOptionSelected,
                ]}
                onPress={() => {
                  setGender(option.value);
                  setShowGenderPicker(false);
                  setErrors(prev => ({ ...prev, gender: '' }));
                }}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    gender === option.value && styles.genderOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {gender === option.value && (
                  <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 48,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  datePickerTrigger: {
    cursor: 'pointer',
  },
  placeholderText: {
    color: COLORS.mutedText,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 28,
    paddingVertical: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Date picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  pickerRow: {
    flexDirection: 'row',
    height: 280,
    paddingHorizontal: 12,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
  },
  pickerItemText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  modalConfirmButton: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Gender modal
  genderModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  genderOptionSelected: {
    backgroundColor: 'rgba(74, 124, 89, 0.05)',
  },
  genderOptionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
