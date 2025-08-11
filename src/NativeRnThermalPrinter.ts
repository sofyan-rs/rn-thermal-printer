import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type PaperType = '58mm' | '80mm';

export type CommonPrintOptions = {
  timeout?: number; // ms
  autoCut?: boolean; // send cut command
  mmFeedPaper?: number; // feed after print, mm
  openCashbox?: boolean; // send cash drawer pulse
  density?: number; // 0..5 (device-dependent)
  codepage?: string; // e.g. 'CP437', 'CP1252'
  bold?: boolean;
  underline?: boolean;
};

export type TcpOptions = CommonPrintOptions & {
  ip: string;
  port: number; // default 9100
  printerWidthMM?: 58 | 80;
  charsPerLine?: number; // 32 for 58mm, 48 for 80mm
  payload: string; // plain text with markup (see README)
};

export type BtOptions = CommonPrintOptions & {
  macAddress: string; // Android only
  payload: string;
  printerWidthMM?: 58 | 80;
  charsPerLine?: number;
};

export type UsbOptions = CommonPrintOptions & {
  vendorId: number; // Android only
  productId: number;
  payload: string;
  printerWidthMM?: 58 | 80;
  charsPerLine?: number;
};

export interface Spec extends TurboModule {
  printTcp(options: TcpOptions): Promise<void>;
  printBluetooth(options: BtOptions): Promise<void>; // Android
  printUsb(options: UsbOptions): Promise<void>; // Android
}

export default TurboModuleRegistry.getEnforcing<Spec>('RnThermalPrinter');
