import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

// Attach a hardware-back listener that runs `onBack` and swallows the
// event so Android doesn't background/exit the app. iOS is a no-op.
// Pass `active` to gate the listener (e.g. only when a modal is open).
export function useAndroidBack(onBack: () => boolean | void, active = true) {
  useEffect(() => {
    if (Platform.OS !== 'android' || !active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const handled = onBack();
      // Falsy return means "we handled it, don't propagate". Truthy means
      // caller wants the default behaviour (usually exit).
      return handled === true ? false : true;
    });
    return () => sub.remove();
  }, [onBack, active]);
}
