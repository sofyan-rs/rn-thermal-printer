# RN Thermal Printer

An original Android React Native module for Bluetooth Classic thermal printers. It keeps a configurable pool of persistent RFCOMM connections and evicts the least-recently-used idle connection when full.

## Install

```sh
yarn add @sofyan-rs/rn-thermal-printer
```

## Usage

```ts
import {thermalPrinter} from '@sofyan-rs/rn-thermal-printer';

await thermalPrinter.configure({maxPersistentConnections: 5});
await thermalPrinter.connect('AA:BB:CC:DD:EE:FF', 8000);
await thermalPrinter.write('AA:BB:CC:DD:EE:FF', base64EscPosBytes);
await thermalPrinter.close('AA:BB:CC:DD:EE:FF');
```

The module is Android-only. Calls are serialized natively so a receipt is never interleaved with another printer write.

## API

- `configure({maxPersistentConnections})`
- `connect(macAddress, timeoutMs)`
- `write(macAddress, base64Bytes)`
- `close(macAddress)` and `closeAll()`
- `getConnections()`

MIT licensed.
