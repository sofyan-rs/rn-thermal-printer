package com.rnthermalprinter

// React / TurboModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Promise
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule

// Generated spec (New Architecture)
import com.rnthermalprinter.NativeRnThermalPrinterSpec

// Android
import android.app.PendingIntent
import android.bluetooth.BluetoothAdapter
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.graphics.BitmapFactory

// DantSu (ESC/POS)
import com.dantsu.escposprinter.EscPosPrinter
import com.dantsu.escposprinter.EscPosCharsetEncoding
import com.dantsu.escposprinter.connection.DeviceConnection
import com.dantsu.escposprinter.connection.tcp.TcpConnection
import com.dantsu.escposprinter.connection.bluetooth.BluetoothConnection
import com.dantsu.escposprinter.connection.usb.UsbConnection
import com.dantsu.escposprinter.connection.usb.UsbPrintersConnections
import com.dantsu.escposprinter.textparser.PrinterTextParserImg

// Java
import java.net.URL
import java.util.concurrent.Executors

@ReactModule(name = RnThermalPrinterModule.NAME)
class RnThermalPrinterModule(reactContext: ReactApplicationContext) :
  NativeRnThermalPrinterSpec(reactContext), TurboModule {

  companion object { const val NAME = "RnThermalPrinter" }
  override fun getName() = NAME

  private val executor = Executors.newSingleThreadExecutor()
  private val ACTION_USB_PERMISSION = "com.rnthermalprinter.USB_PERMISSION"

  private data class Flags(
    val autoCut: Boolean, val openCashbox: Boolean, val mmFeedPaper: Float,
    val bold: Boolean, val underline: Boolean, val codepage: EscPosCharsetEncoding?
  ) {
    fun decorate(s: String): String {
      var t = s
      if (bold) t = "[B]$t[/B]"
      if (underline) t = "[U]$t[/U]"
      return t
    }
  }

  private fun readFlags(o: ReadableMap) = Flags(
    o.getBoolean("autoCut", false),
    o.getBoolean("openCashbox", false),
    o.getDouble("mmFeedPaper", 0.0).toFloat().coerceAtLeast(0f),
    o.getBoolean("bold", false),
    o.getBoolean("underline", false),
    o.getString("codepage")?.let { toCharsetEncoding(it) }
  )

  private fun ReadableMap.getBoolean(k: String, def: Boolean) =
    if (hasKey(k) && !isNull(k)) getBoolean(k) else def
  private fun ReadableMap.getDouble(k: String, def: Double) =
    if (hasKey(k) && !isNull(k)) getDouble(k) else def
  private fun ReadableMap.getIntOrNull(k: String): Int? =
    if (hasKey(k) && !isNull(k)) getInt(k) else null
  private fun reqString(m: ReadableMap, key: String) =
    m.getString(key) ?: throw IllegalArgumentException("$key required")

  private fun resolvePaper(o: ReadableMap): Pair<Float, Int> {
    val w = if (o.hasKey("printerWidthMM") && !o.isNull("printerWidthMM")) o.getInt("printerWidthMM").toFloat() else 58f
    val cpl = if (o.hasKey("charsPerLine") && !o.isNull("charsPerLine")) o.getInt("charsPerLine") else if (w >= 80f) 48 else 32
    return w to cpl
  }

  private fun buildPrinter(conn: DeviceConnection, w: Float, cpl: Int, cp: EscPosCharsetEncoding?): EscPosPrinter {
    val dpi = 203
    return if (cp != null) EscPosPrinter(conn, dpi, w, cpl, cp) else EscPosPrinter(conn, dpi, w, cpl)
  }

  private fun resolveRemoteImages(printer: EscPosPrinter, payload: String): String {
    val regex = Regex("""<img>(.*?)</img>""", RegexOption.IGNORE_CASE)
    return regex.replace(payload) { m ->
      val src = m.groupValues[1].trim()
      return@replace try {
        if (src.startsWith("http://") || src.startsWith("https://")) {
          URL(src).openStream().use { ins ->
            val bmp = BitmapFactory.decodeStream(ins) ?: return@replace m.value
            val hex = PrinterTextParserImg.bitmapToHexadecimalString(printer, bmp)
            "<img>$hex</img>"
          }
        } else {
          m.value // Let DantSu handle local path/content://
        }
      } catch (_: Exception) {
        m.value
      }
    }
  }

  private fun printWithOptions(printer: EscPosPrinter, text: String, f: Flags) {
    val processed = resolveRemoteImages(printer, f.decorate(text))
    when {
      f.openCashbox -> printer.printFormattedTextAndOpenCashBox(processed, f.mmFeedPaper)
      f.autoCut     -> printer.printFormattedTextAndCut(processed, f.mmFeedPaper)
      else          -> printer.printFormattedText(processed, f.mmFeedPaper)
    }
  }

  private fun toCharsetEncoding(name: String): EscPosCharsetEncoding? = when (name.trim().uppercase()) {
    "CP437","IBM437" -> EscPosCharsetEncoding("CP437", 0)
    "CP850","IBM850" -> EscPosCharsetEncoding("CP850", 2)
    "CP852"          -> EscPosCharsetEncoding("CP852", 18)
    "CP858"          -> EscPosCharsetEncoding("CP858", 19)
    "CP860"          -> EscPosCharsetEncoding("CP860", 3)
    "CP861"          -> EscPosCharsetEncoding("CP861", 4)
    "CP863"          -> EscPosCharsetEncoding("CP863", 6)
    "CP865"          -> EscPosCharsetEncoding("CP865", 8)
    "CP866"          -> EscPosCharsetEncoding("CP866", 17)
    "CP1250"         -> EscPosCharsetEncoding("windows-1250", 45)
    "CP1251"         -> EscPosCharsetEncoding("windows-1251", 44)
    "CP1252"         -> EscPosCharsetEncoding("windows-1252", 16)
    "CP1254"         -> EscPosCharsetEncoding("windows-1254", 46)
    else -> null
  }

  // ------- TCP -------
  override fun printTcp(options: ReadableMap, promise: Promise) {
    executor.execute {
      try {
        val ip = reqString(options, "ip")
        val port = if (options.hasKey("port") && !options.isNull("port")) options.getInt("port") else 9100
        val timeout = if (options.hasKey("timeout") && !options.isNull("timeout")) options.getInt("timeout") else 3000
        val payload = reqString(options, "payload")
        val (w, cpl) = resolvePaper(options)
        val flags = readFlags(options)

        val connection = TcpConnection(ip, port, timeout)
        val printer = buildPrinter(connection, w, cpl, flags.codepage)

        printWithOptions(printer, payload, flags)
        connection.disconnect()
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("TCP_PRINT_ERROR", e)
      }
    }
  }

  // ------- Bluetooth -------
  override fun printBluetooth(options: ReadableMap, promise: Promise) {
    executor.execute {
      try {
        val mac = reqString(options, "macAddress")
        val payload = reqString(options, "payload")
        val (w, cpl) = resolvePaper(options)
        val flags = readFlags(options)

        val device = BluetoothAdapter.getDefaultAdapter()?.getRemoteDevice(mac)
          ?: throw IllegalStateException("Bluetooth device not found for $mac")
        val connection = BluetoothConnection(device)

        val printer = buildPrinter(connection, w, cpl, flags.codepage)
        printWithOptions(printer, payload, flags)
        connection.disconnect()
        promise.resolve(null)
      } catch (e: SecurityException) {
        promise.reject("BLUETOOTH_PERMISSION", e)
      } catch (e: Exception) {
        promise.reject("BLUETOOTH_PRINT_ERROR", e)
      }
    }
  }

  // ------- USB -------
  override fun printUsb(options: ReadableMap, promise: Promise) {
    val usbManager = reactApplicationContext.getSystemService(Context.USB_SERVICE) as UsbManager
    executor.execute {
      try {
        val payload = reqString(options, "payload")
        val (w, cpl) = resolvePaper(options)
        val flags = readFlags(options)

        val vendorId = options.getIntOrNull("vendorId")
        val productId = options.getIntOrNull("productId")

        val usbConnection: UsbConnection = if (vendorId != null && productId != null) {
          val device = usbManager.deviceList.values.firstOrNull {
            it.vendorId == vendorId && it.productId == productId
          } ?: throw IllegalStateException("USB device $vendorId:$productId not found")
          UsbConnection(usbManager, device)
        } else {
          UsbPrintersConnections.selectFirstConnected(reactApplicationContext)
            ?: throw IllegalStateException("No USB ESC/POS printer found")
        }

        val device = usbConnection.device
        if (!usbManager.hasPermission(device)) {
          requestUsbPermission(usbManager, device) { granted, err ->
            if (!granted) {
              promise.reject("USB_PERMISSION", err ?: Exception("USB permission denied"))
            } else {
              try {
                val printer = buildPrinter(usbConnection, w, cpl, flags.codepage)
                printWithOptions(printer, payload, flags)
                usbConnection.disconnect()
                promise.resolve(null)
              } catch (e: Exception) {
                promise.reject("USB_PRINT_ERROR", e)
              }
            }
          }
        } else {
          val printer = buildPrinter(usbConnection, w, cpl, flags.codepage)
          printWithOptions(printer, payload, flags)
          usbConnection.disconnect()
          promise.resolve(null)
        }
      } catch (e: Exception) {
        promise.reject("USB_PRINT_ERROR", e)
      }
    }
  }

  private fun requestUsbPermission(
    usbManager: UsbManager,
    device: UsbDevice,
    callback: (Boolean, Exception?) -> Unit
  ) {
    val pi = PendingIntent.getBroadcast(
      reactApplicationContext, 0, Intent(ACTION_USB_PERMISSION),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == ACTION_USB_PERMISSION) {
          reactApplicationContext.unregisterReceiver(this)
          val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
          callback(granted, if (granted) null else SecurityException("USB permission denied"))
        }
      }
    }
    reactApplicationContext.registerReceiver(receiver, IntentFilter(ACTION_USB_PERMISSION))
    usbManager.requestPermission(device, pi)
  }
}