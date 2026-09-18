import {NativeModules, Platform} from 'react-native';

export type ThermalConnection = {
  macAddress: string;
  connected: boolean;
  lastUsedAt: number;
};

export type WriteResult = {bytesWritten: number};

type NativeThermalPrinter = {
  configure(maxPersistentConnections: number): Promise<void>;
  connect(macAddress: string, timeoutMs: number): Promise<ThermalConnection>;
  write(macAddress: string, base64Bytes: string): Promise<WriteResult>;
  close(macAddress: string): Promise<void>;
  closeAll(): Promise<void>;
  getConnections(): Promise<ThermalConnection[]>;
};

const native = NativeModules.RNPersistentThermalPrinter as
  | NativeThermalPrinter
  | undefined;

const requireAndroid = (): NativeThermalPrinter => {
  if (Platform.OS !== 'android') throw new Error('RN Thermal Printer supports Android only');
  if (!native) throw new Error('RNPersistentThermalPrinter native module is not linked');
  return native;
};

export const thermalPrinter = {
  configure: ({maxPersistentConnections}: {maxPersistentConnections: number}) =>
    requireAndroid().configure(maxPersistentConnections),
  connect: (macAddress: string, timeoutMs = 8000) =>
    requireAndroid().connect(macAddress, timeoutMs),
  write: (macAddress: string, base64Bytes: string) =>
    requireAndroid().write(macAddress, base64Bytes),
  close: (macAddress: string) => requireAndroid().close(macAddress),
  closeAll: () => requireAndroid().closeAll(),
  getConnections: () => requireAndroid().getConnections(),
};
