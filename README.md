# @sofyan.rs/rn-thermal-printer

Native bridge for thermal printer. Support Bluetooth, TCP, and USB printer with New Arch & Turbo Module.

### Android Only for Now

Native library for Android : https://github.com/DantSu/ESCPOS-ThermalPrinter-Android/tree/3.0.1

## Installation

```sh
# npm
npm install @sofyan.rs/rn-thermal-printer

# yarn
yarn add @sofyan.rs/rn-thermal-printer
```

## Android Manifest

Nake sure you have this following permission in <b><i>android/app/src/main/AndroidManifest.xml</i></b>

#### TCP Printer

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

#### Bluetooth Printer

```xml
<!-- Android 12+ -->
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />

<!-- For Android 11 and lower (scans reveal location) -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

#### USB Printer

```xml
<uses-feature android:name="android.hardware.usb.host" />
<uses-permission android:name="android.permission.USB_PERMISSION" tools:node="remove" />
```

## Usage

### Printer Bluetooth

Pair your bluetooth device and scan your bluetooth device using this library https://www.npmjs.com/package/react-native-bluetooth-classic to get macAddress of the device.

```ts
import { printBluetooth } from '@sofyan.rs/rn-thermal-printer';

try {
  await printBluetooth({
    macAddress: '66:32:3D:9A:31:B3',
    payload: 'Hello World!',
    printerWidthMM: 58,
    charsPerLine: 32,
    autoCut: true,
    openCashbox: true,
    mmFeedPaper: 20,
  });
} catch (error) {
  console.error('Print failed:', error);
}
```

### Printer TCP

Connect your printer using local network.

```ts
import { printTcp } from '@sofyan.rs/rn-thermal-printer';

try {
  await printTcp({
    ip: '192.168.100.103',
    port: 9100,
    payload: 'Hello World!',
    printerWidthMM: 58,
    charsPerLine: 32,
    autoCut: true,
    openCashbox: true,
    mmFeedPaper: 20,
  });
} catch (error) {
  console.error('Print failed:', error);
}
```

### Printer USB

Connect your printer using usb serial.

```ts
import { printUsb } from '@sofyan.rs/rn-thermal-printer';

try {
  await printUsb({
    productId: 2223210,
    vendorId: 3232302,
    payload: 'Hello World!',
    printerWidthMM: 58,
    charsPerLine: 32,
    autoCut: true,
    openCashbox: true,
    mmFeedPaper: 20,
  });
} catch (error) {
  console.error('Print failed:', error);
}
```

## Method

| Name           | Param        |
| -------------- | ------------ |
| printTcp       | `TcpOptions` |
| printBluetooth | `BtOptions`  |
| printBluetooth | `UsbOptions` |

### Interface

```ts
export type CommonPrintOptions = {
  timeout?: number; // ms
  autoCut?: boolean; // send cut command
  mmFeedPaper?: number; // feed after print, mm
  openCashbox?: boolean; // send cash drawer pulse
  density?: number; // 0..5 (device-dependent)
  codepage?: string; // e.g. 'CP437', 'CP1252'
  bold?: boolean;
  underline?: boolean;
  printerWidthMM?: 58 | 80;
  charsPerLine?: number; // 32 for 58mm, 48 for 80mm
  payload: string; // plain text with markup (see README)
};

export type TcpOptions = CommonPrintOptions & {
  ip: string;
  port: number; // default 9100
};

export type BtOptions = CommonPrintOptions & {
  macAddress: string;
};

export type UsbOptions = CommonPrintOptions & {
  vendorId: number;
  productId: number;
};
```

## Config

| Name           | Type       | Description                              |
| -------------- | ---------- | ---------------------------------------- |
| timeout        | `number`   | timout connection in ms                  |
| autoCut        | `boolean`  | auto cut paper after print               |
| mmFeedPaper    | `number`   | feed paper (mm)                          |
| openCashbox    | `boolean`  | open cashbox after print                 |
| density        | `number`   | 0..5 (device-dependent)                  |
| codepage       | `string`   | e.g. 'CP437', 'CP1252'                   |
| bold           | `boolean`  | add underline on text                    |
| underline      | `boolean`  | use bold for text                        |
| printerWidthMM | `58 \| 80` | printing width (mm)                      |
| charsPerLine   | `number`   | maximum char per line                    |
| payload        | `string`   | formatted text that will send to printer |
| ip             | `string`   | ip address of tcp printer device         |
| port           | `number`   | port of tcp printer device               |
| macAddress     | `string`   | mac address of bluetooth printer device  |
| vendorId       | `number`   | vendor id of usb printer device          |
| productId      | `number`   | product id of usb printer device         |

## Payload / Formatted text : syntax guide

Same as https://github.com/DantSu/ESCPOS-ThermalPrinter-Android?tab=readme-ov-file#formatted-text--syntax-guide except for the `<img></img>` tag

### New line

Use `\n` to create a new line of text.

### Text alignment and column separation

Add an alignment tag on a same line of text implicitly create a new column.

Column alignment tags :

- `[L]` : left side alignment
- `[C]` : center alignment
- `[R]` : right side alignment

Example :

- `[L]Some text` : One column aligned to left
- `[C]Some text` : One column aligned to center
- `[R]Some text` : One column aligned to right
- `[L]Some text[L]Some other text` : Two columns aligned to left. `Some other text` starts in the center of the paper.
- `[L]Some text[R]Some other text` : Two columns, first aligned to left, second aligned to right. `Some other text` is printed at the right of paper.
- `[L]Some[R]text[R]here` : Three columns.
- `[L][R]text[R]here` : Three columns. The first is empty but it takes a third of the available space.

### Font

#### Size

`<font></font>` tag allows you to change the font size and color. Default size is `normal` / `black`.

- `<font size='normal'>Some text</font>` : Normal size
- `<font size='wide'>Some text</font>` : Double width of medium size
- `<font size='tall'>Some text</font>` : Double height of medium size
- `<font size='big'>Some text</font>` : Double width and height of medium size
- `<font size='big-2'>Some text</font>` : 3 x width and height
- `<font size='big-3'>Some text</font>` : 4 x width and height
- `<font size='big-4'>Some text</font>` : 5 x width and height
- `<font size='big-5'>Some text</font>` : 6 x width and height
- `<font size='big-6'>Some text</font>` : 7 x width and height

- `<font color='black'>Some text</font>` : black text - white background
- `<font color='bg-black'>Some text</font>` : white text - black background
- `<font color='red'>Some text</font>` : red text - white background (Not working on all printer)
- `<font color='bg-red'>Some text</font>` : white text - red background (Not working on all printer)

#### Bold

`<b></b>` tag allows you to change the font weight.

- `<b>Some text</b>`

#### Underline

`<u></u>` tag allows you to underline the text.

- `<u>Some text</u>` text underlined
- `<u type='double'>Some text</u>` text double-strike (Not working on all printer)

### Image

`<img></img>` tag allows you to print image. Inside the tag you need to insert an image url.

- `<img>`img url`</img>` : Print image with original size
- `<img width='200'>`img url`</img>` : Print image with width of 200 pixels (height auto-calculated)
- `<img height='150'>`img url`</img>` : Print image with height of 150 pixels (width auto-calculated)
- `<img width='200' height='150'>`img url`</img>` : Print image with specific width and height

**⚠ WARNING ⚠** : This tag has several constraints :

- A line that contains `<img></img>` can have only one alignment tag and it must be at the beginning of the line.
- `<img>` must be directly preceded by nothing or an alignment tag (`[L][C][R]`).
- `</img>` must be directly followed by a new line `\n`.
- Maximum height of printed image is 256px, If you want to print larger bitmap. Please refer to this solution: [#70](https://github.com/DantSu/ESCPOS-ThermalPrinter-Android/issues/70#issuecomment-714390014)
- When both width and height are specified, the image may be distorted if the aspect ratio doesn't match the original
- When only width or height is specified, the other dimension is calculated to maintain aspect ratio

### Barcode

`<barcode></barcode>`
