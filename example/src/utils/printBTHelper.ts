import { Platform } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // iOS doesn't require these permissions
  }

  let granted = false;

  // Android 12+
  if (Platform.Version >= 31) {
    const result = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
    if (result === RESULTS.GRANTED) {
      granted = true;
    }
    const result2 = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
    if (result2 === RESULTS.GRANTED) {
      granted = true;
    }
    return granted;
  }

  // Android 6 (API 23) to Android 11 (API 30) - use location permission for Bluetooth scanning
  if (Platform.Version >= 23) {
    const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    if (result === RESULTS.GRANTED) {
      granted = true;
    }
    return granted;
  }

  // Android below API 23 - no runtime permissions required
  else {
    return true;
  }
};
