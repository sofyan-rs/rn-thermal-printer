import Foundation
import Network
import React

@objc(RnThermalPrinter)
class RnThermalPrinter: NSObject {}

// MARK: - Spec glue (New Architecture codegen)
@objc(RnThermalPrinterModule)
class RnThermalPrinterModule: NativeRnThermalPrinterSpec {
  override class func moduleName() -> String! { "RnThermalPrinter" }
  override func constantsToExport() -> [AnyHashable : Any]! { [:] }

  // MARK: - Public API

  override func printTcp(_ options: [AnyHashable : Any]!, resolver resolve: RCTPromiseResolveBlock!, rejecter reject: RCTPromiseRejectBlock!) {
    guard
      let ip = options["ip"] as? String,
      let port = (options["port"] as? NSNumber)?.intValue ?? 9100 as Int?,
      let payload = options["payload"] as? String
    else {
      return reject("E_ARGS", "Missing required fields (ip, port, payload)", nil)
    }

    let timeoutMs = (options["timeout"] as? NSNumber)?.intValue ?? 3000

    // flags
    let autoCut = (options["autoCut"] as? NSNumber)?.boolValue ?? false
    let openCashbox = (options["openCashbox"] as? NSNumber)?.boolValue ?? false
    let mmFeed = (options["mmFeedPaper"] as? NSNumber)?.doubleValue ?? 0.0
    let codepageName = options["codepage"] as? String
    // NOTE: density is vendor-specific; ignored here. bold/underline would require parsing custom markup.

    // Build ESC/POS data
    var data = Data()

    // Optional: switch code page if provided
    if let enc = escposEncoding(for: codepageName) {
      data.append(contentsOf: [0x1B, 0x74, enc.codePage])  // ESC t n
    }

    // Payload text (assume already formatted for alignment/bold/etc. if you use markup in Android)
    if let textBytes = payload.data(using: escposStringEncoding(for: codepageName)) {
      data.append(textBytes)
    }

    // Feed in DOTS (ESC J n), n=0..255; ~8 dots per mm at 203dpi
    let dots = max(0, min(255, Int(mmFeed * 8.0)))
    if dots > 0 {
      data.append(contentsOf: [0x1B, 0x4A, UInt8(dots)]) // ESC J n
    }

    if openCashbox {
      // Pulse drawer kick (ESC p m t1 t2). m=0 is Drawer 2 on many printers; 0x32 (50ms) pulses are common.
      data.append(contentsOf: [0x1B, 0x70, 0x00, 0x32, 0x32])
      // Many cash drawers also expect a cut; keep your flag semantics simple:
      data.append(contentsOf: [0x1D, 0x56, 0x41, 0x00]) // GS V m (partial cut)
    } else if autoCut {
      data.append(contentsOf: [0x1D, 0x56, 0x41, 0x00]) // cut
    }

    tcpSend(ip: ip, port: port, payload: data, timeoutMs: timeoutMs) { result in
      switch result {
      case .success:
        resolve(nil)
      case .failure(let err):
        reject("E_TCP", err.localizedDescription, err)
      }
    }
  }

  override func printBluetooth(_ options: [AnyHashable : Any]!, resolver resolve: RCTPromiseResolveBlock!, rejecter reject: RCTPromiseRejectBlock!) {
    reject("E_UNSUPPORTED", "Bluetooth printing is not available on iOS without a vendor SDK (e.g., Epson ePOS, StarIO).", nil)
  }

  override func printUsb(_ options: [AnyHashable : Any]!, resolver resolve: RCTPromiseResolveBlock!, rejecter reject: RCTPromiseRejectBlock!) {
    reject("E_UNSUPPORTED", "USB printing is not available on iOS.", nil)
  }
}

// MARK: - TCP helper
extension RnThermalPrinterModule {
  private func tcpSend(ip: String, port: Int, payload: Data, timeoutMs: Int, completion: @escaping (Result<Void, Error>) -> Void) {
    let params = NWParameters.tcp
    let connection = NWConnection(host: NWEndpoint.Host(ip), port: NWEndpoint.Port(integerLiteral: NWEndpoint.Port.IntegerLiteralType(port)), using: params)

    let deadline = DispatchTime.now() + .milliseconds(timeoutMs)
    let queue = DispatchQueue(label: "rnthermalprinter.tcp")

    connection.stateUpdateHandler = { state in
      switch state {
      case .ready:
        connection.send(content: payload, completion: .contentProcessed { sendErr in
          if let err = sendErr {
            completion(.failure(err))
          } else {
            connection.cancel()
            completion(.success(()))
          }
        })
      case .failed(let err):
        completion(.failure(err))
      default:
        break
      }
    }

    connection.start(queue: queue)

    // Simple timeout
    queue.asyncAfter(deadline: deadline) {
      if case .waiting = connection.state {} // no-op
      connection.cancel()
    }
  }
}

// MARK: - Encoding helpers
extension RnThermalPrinterModule {
  struct Codepage {
    let name: String
    let codePage: UInt8   // ESC t n value
    let cfEncoding: String.Encoding
  }

  private func escposStringEncoding(for codepage: String?) -> String.Encoding {
    // Map a few common ones; fallback to .utf8 (some printers accept it; others need code page set)
    switch codepage?.uppercased() {
    case "CP437", "IBM437": return .ascii
    case "CP850", "IBM850": return .isoLatin1
    case "CP852":           return .isoLatin2
    case "CP858":           return .isoLatin1
    case "CP866":           return .windowsCP1251 // close-ish Cyrillic
    case "CP1250":          return .windowsCP1250
    case "CP1251":          return .windowsCP1251
    case "CP1252":          return .windowsCP1252
    case "CP1254":          return .windowsCP1254
    default:                return .utf8
    }
  }

  private func escposEncoding(for codepage: String?) -> Codepage? {
    guard let key = codepage?.uppercased() else { return nil }
    switch key {
    case "CP437", "IBM437":  return Codepage(name: key, codePage: 0,  cfEncoding: .ascii)
    case "CP850", "IBM850":  return Codepage(name: key, codePage: 2,  cfEncoding: .isoLatin1)
    case "CP852":            return Codepage(name: key, codePage: 18, cfEncoding: .isoLatin2)
    case "CP858":            return Codepage(name: key, codePage: 19, cfEncoding: .isoLatin1)
    case "CP866":            return Codepage(name: key, codePage: 17, cfEncoding: .windowsCP1251)
    case "CP1250":           return Codepage(name: key, codePage: 45, cfEncoding: .windowsCP1250)
    case "CP1251":           return Codepage(name: key, codePage: 44, cfEncoding: .windowsCP1251)
    case "CP1252":           return Codepage(name: key, codePage: 16, cfEncoding: .windowsCP1252)
    case "CP1254":           return Codepage(name: key, codePage: 46, cfEncoding: .windowsCP1254)
    default:                 return nil
    }
  }
}