import {
  Modal,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { requestBluetoothPermissions } from '../utils/printBTHelper';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { useEffect, useState } from 'react';

export interface BTDevice {
  macAddress: string;
  deviceName: string;
}

interface Props {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  setMacAddress: (value: string) => void;
}

export default function SearchBTDevices({
  showModal,
  setShowModal,
  setMacAddress,
}: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState<BTDevice[]>([]);

  const handleSearch = async () => {
    setRefreshing(true);
    const hasPermissions = await requestBluetoothPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth permissions not granted');
    }
    const pairedDevices = await RNBluetoothClassic.getBondedDevices();
    // console.log(pairedDevices);
    if (pairedDevices.length > 0) {
      const deviceData = pairedDevices.map((item: any) => {
        return {
          macAddress: item.address,
          deviceName: item.name,
        };
      });
      setDevices(deviceData);
    }
    setRefreshing(false);
  };

  const onRefresh = async () => {
    handleSearch();
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
            key={item.macAddress}
            onPress={() => {
              setMacAddress(item.macAddress);
              setShowModal(false);
            }}
            style={styles.deviceItem}
          >
            <Text style={styles.deviceItemText}>{item.deviceName}</Text>
            <Text style={styles.deviceItemText}>{item.macAddress}</Text>
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
