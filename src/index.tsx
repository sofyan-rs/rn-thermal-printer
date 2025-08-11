import Native from './NativeRnThermalPrinter';

export const printTcp = (o: Parameters<typeof Native.printTcp>[0]) =>
  Native.printTcp(o);
export const printBluetooth = (
  o: Parameters<typeof Native.printBluetooth>[0]
) => Native.printBluetooth(o);
export const printUsb = (o: Parameters<typeof Native.printUsb>[0]) =>
  Native.printUsb(o);

export default {
  printTcp,
  printBluetooth,
  printUsb,
};
