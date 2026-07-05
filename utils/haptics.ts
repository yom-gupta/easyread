// Thin haptics wrapper. Requires expo-haptics; falls back to no-op when the
// module isn't installed so nothing crashes on cold boot before `npm install`.
let mod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('expo-haptics');
} catch {
  mod = null;
}

const safe = (fn: () => void) => {
  try { fn(); } catch { /* silent */ }
};

export const haptics = {
  select:    () => mod && safe(() => mod.selectionAsync()),
  tapLight:  () => mod && safe(() => mod.impactAsync(mod.ImpactFeedbackStyle.Light)),
  tapMedium: () => mod && safe(() => mod.impactAsync(mod.ImpactFeedbackStyle.Medium)),
  tapHeavy:  () => mod && safe(() => mod.impactAsync(mod.ImpactFeedbackStyle.Heavy)),
  success:   () => mod && safe(() => mod.notificationAsync(mod.NotificationFeedbackType.Success)),
  warning:   () => mod && safe(() => mod.notificationAsync(mod.NotificationFeedbackType.Warning)),
  error:     () => mod && safe(() => mod.notificationAsync(mod.NotificationFeedbackType.Error)),
};
