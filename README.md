# @sofyan.rs/rn-thermal-printer

Native bridge for thermal printer. Support Bluetooth, TCP, and USB printer.

### Android Only for Now

Native library: https://github.com/DantSu/ESCPOS-ThermalPrinter-Android/tree/3.0.1

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

Same as https://github.com/DantSu/ESCPOS-ThermalPrinter-Android?tab=readme-ov-file#formatted-text--syntax-guide except for the <img></img> tag

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

- `<img>`img url`</img>`

**⚠ WARNING ⚠** : This tag has several constraints :

- A line that contains `<img></img>` can have only one alignment tag and it must be at the beginning of the line.
- `<img>` must be directly preceded by nothing or an alignment tag (`[L][C][R]`).
- `</img>` must be directly followed by a new line `\n`.
- Maximum height of printed image is 256px, If you want to print larger bitmap. Please refer to this solution: [#70](https://github.com/DantSu/ESCPOS-ThermalPrinter-Android/issues/70#issuecomment-714390014)

### Barcode

`<barcode></barcode>` tag allows you to print a barcode. Inside the tag you need to write the code number to print.

- `<barcode>451278452159</barcode>` : **(12 numbers)**
  Prints a EAN13 barcode (height: 10mm, width: ~70% printer width, text: displayed below).
- `<barcode type='ean8'>4512784</barcode>` : **(7 numbers)**
  Prints a EAN8 barcode (height: 10mm, width: ~70% printer width, text: displayed below).
- `<barcode type='upca' height='20'>4512784521</barcode>` : **(11 numbers)**
  Prints a UPC-A barcode (height: 20mm, width: ~70% printer width, text: displayed below).
- `<barcode type='upce' height='25' width='50' text='none'>512789</barcode>` : **(6 numbers)**
  Prints a UPC-E barcode (height: 25mm, width: ~50mm, text: hidden).
- `<barcode type='128' width='40' text='above'>DantSu</barcode>` : **(string)**
  Prints a barcode 128 (height: 10mm, width: ~40mm, text: displayed above).

**⚠ WARNING ⚠** : This tag has several constraints :

- A line that contains `<barcode></barcode>` can have only one alignment tag and it must be at the beginning of the line.
- `<barcode>` must be directly preceded by nothing or an alignment tag (`[L][C][R]`).
- `</barcode>` must be directly followed by a new line `\n`.
- You can't write text on a line that contains `<barcode></barcode>`.

### QR Code

`<qrcode></qrcode>` tag allows you to print a QR code. Inside the tag you need to write the QR code data.

- `<qrcode>https://dantsu.com/</qrcode>` :
  Prints a QR code with a width and height of 20 millimeters.
- `<qrcode size='25'>123456789</qrcode>` :
  Prints a QR code with a width and height of 25 millimeters.

**⚠ WARNING ⚠** : This tag has several constraints :

- A line that contains `<qrcode></qrcode>` can have only one alignment tag and it must be at the beginning of the line.
- `<qrcode>` must be directly preceded by nothing or an alignment tag (`[L][C][R]`).
- `</qrcode>` must be directly followed by a new line `\n`.
- You can't write text on a line that contains `<qrcode></qrcode>`.

place the image url directly between the img tags

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
