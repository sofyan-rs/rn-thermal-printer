import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SerialBluetoothManager } from 'react-native-serialport-bluetooth';

export interface USBDevice {
  name: string;
  deviceId: number;
  productId: number;
  vendorId: number;
}

interface Props {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  setProductId: (value: string) => void;
  setVendorId: (value: string) => void;
}

export default function SearchUSBDevices({
  showModal,
  setShowModal,
  setProductId,
  setVendorId,
}: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState<USBDevice[]>([]);

  const handleSearch = async () => {
    setRefreshing(true);
    const usbDevices = await SerialBluetoothManager.list();
    console.log('Available devices:', usbDevices);
    if (usbDevices.length > 0) {
      const devicesData = usbDevices.map((device) => ({
        name: device.name,
        deviceId: device.deviceId,
        productId: device.productId,
        vendorId: device.vendorId,
      }));
      setDevices(devicesData);
    }
    setRefreshing(false);
  };

  const onRefresh = async () => {
    handleSearch();
  };

  const connectToDevice = async (device: USBDevice) => {
    let hasPermission = false;
    hasPermission = await SerialBluetoothManager.hasPermission(device.deviceId);
    if (!hasPermission) {
      hasPermission = await SerialBluetoothManager.tryRequestPermission(
        device.deviceId
      );
    }
    if (hasPermission) {
      console.log('Permission granted');
      setProductId(device.productId.toString());
      setVendorId(device.vendorId.toString());
      setShowModal(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <Modal
      animationType="slide"
      visible={showModal}
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.header}>
        <Text style={styles.h1}>Connect to Bluetooth Devices</Text>
        <TouchableOpacity onPress={() => setShowModal(false)}>
          <Text style={styles.closeButton}>CLOSE</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <TouchableOpacity
            key={item.deviceId}
            onPress={() => {
              connectToDevice(item);
            }}
            style={styles.deviceItem}
          >
            <Text style={styles.deviceItemText}>{item.name}</Text>
            <Text style={styles.deviceItemText}>
              {item.productId} - {item.vendorId} - {item.deviceId}
            </Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No devices found</Text>
          </View>
        }
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f0f0f0',
  },
  h1: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  deviceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deviceItemText: {
    fontSize: 16,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007BFF',
  },
});
