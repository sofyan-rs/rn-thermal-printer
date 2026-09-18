package com.sofyan.thermalprinter;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Base64;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class ThermalPrinterModule extends ReactContextBaseJavaModule {
  private static final UUID RFCOMM_UUID = UUID.fromString("00001101-0000-1000-8000-00805f9b34fb");
  private final ExecutorService executor = Executors.newSingleThreadExecutor();
  private final Map<String, Entry> entries = new LinkedHashMap<>();
  private int capacity = 5;

  private static final class Entry {
    final String macAddress;
    final BluetoothSocket socket;
    final OutputStream output;
    long lastUsedAt;
    Entry(String macAddress, BluetoothSocket socket, OutputStream output) {
      this.macAddress = macAddress; this.socket = socket; this.output = output;
      this.lastUsedAt = System.currentTimeMillis();
    }
  }

  ThermalPrinterModule(ReactApplicationContext context) { super(context); }
  @Override public String getName() { return "RNPersistentThermalPrinter"; }

  @ReactMethod public void configure(final int requestedCapacity, final Promise promise) {
    executor.execute(() -> { capacity = Math.max(1, requestedCapacity); trim(); promise.resolve(null); });
  }

  @ReactMethod public void connect(final String macAddress, final int timeoutMs, final Promise promise) {
    executor.execute(() -> {
      try {
        Entry current = entries.get(macAddress);
        if (current != null && current.socket.isConnected()) { current.lastUsedAt = System.currentTimeMillis(); promise.resolve(info(current)); return; }
        close(macAddress); trim();
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null || !adapter.isEnabled()) throw new IllegalStateException("Bluetooth is unavailable");
        BluetoothDevice device = null;
        for (BluetoothDevice paired : adapter.getBondedDevices()) if (macAddress.equals(paired.getAddress())) { device = paired; break; }
        if (device == null) throw new IllegalArgumentException("Printer is not paired: " + macAddress);
        adapter.cancelDiscovery();
        BluetoothSocket socket = device.createInsecureRfcommSocketToServiceRecord(RFCOMM_UUID);
        socket.connect();
        Entry entry = new Entry(macAddress, socket, socket.getOutputStream());
        entries.put(macAddress, entry);
        promise.resolve(info(entry));
      } catch (Exception error) { promise.reject("E_CONNECT", error.getMessage(), error); }
    });
  }

  @ReactMethod public void write(final String macAddress, final String base64Bytes, final Promise promise) {
    executor.execute(() -> {
      try {
        Entry entry = entries.get(macAddress);
        if (entry == null || !entry.socket.isConnected()) throw new IllegalStateException("No active printer connection for " + macAddress);
        byte[] bytes = Base64.decode(base64Bytes, Base64.DEFAULT);
        entry.output.write(bytes); entry.output.flush(); entry.lastUsedAt = System.currentTimeMillis();
        WritableMap result = Arguments.createMap(); result.putInt("bytesWritten", bytes.length); promise.resolve(result);
      } catch (Exception error) { promise.reject("E_WRITE", error.getMessage(), error); }
    });
  }

  @ReactMethod public void close(final String macAddress, final Promise promise) { executor.execute(() -> { close(macAddress); promise.resolve(null); }); }
  @ReactMethod public void closeAll(final Promise promise) { executor.execute(() -> { for (String mac : new ArrayList<>(entries.keySet())) close(mac); promise.resolve(null); }); }
  @ReactMethod public void getConnections(final Promise promise) { executor.execute(() -> { WritableArray list = Arguments.createArray(); for (Entry entry : entries.values()) list.pushMap(info(entry)); promise.resolve(list); }); }

  private void trim() { while (entries.size() >= capacity) { Entry oldest = null; for (Entry entry : entries.values()) if (oldest == null || entry.lastUsedAt < oldest.lastUsedAt) oldest = entry; if (oldest == null) return; close(oldest.macAddress); } }
  private void close(String macAddress) { Entry entry = entries.remove(macAddress); if (entry == null) return; try { entry.output.close(); } catch (Exception ignored) {} try { entry.socket.close(); } catch (Exception ignored) {} }
  private WritableMap info(Entry entry) { WritableMap map = Arguments.createMap(); map.putString("macAddress", entry.macAddress); map.putBoolean("connected", entry.socket.isConnected()); map.putDouble("lastUsedAt", entry.lastUsedAt); return map; }
}
