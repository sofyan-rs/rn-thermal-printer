import { useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { printBluetooth } from '@sofyan.rs/rn-thermal-printer';
import InputText from './ui/InputText';
import ButtonSubmit from './ui/ButtonSubmit';
import BooleanChoice from './ui/BooleanChoice';
import ButtonClick from './ui/ButtonClick';
import SearchBTDevices from './SearchBTDevices';
import { requestBluetoothPermissions } from '../utils/printBTHelper';
import { payload } from '../utils/payload';

interface Props {
  setError: (error: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  scrollRef: React.RefObject<ScrollView | null>;
}

export default function PrinterBT({
  setError,
  setIsSuccess,
  scrollRef,
}: Props) {
  const [macAddress, setMacAddress] = useState('');
  const [autoCut, setAutoCut] = useState(true);
  const [openCashbox, setOpenCashbox] = useState(false);
  const [is58mm, setIs58mm] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const handlePrint = async () => {
    setIsSuccess(false);
    setError(null);
    try {
      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }
      await printBluetooth({
        macAddress,
        payload,
        printerWidthMM: is58mm ? 58 : 80,
        charsPerLine: is58mm ? 32 : 48,
        autoCut,
        openCashbox,
        mmFeedPaper: 20,
      });
      console.log('Print successful');
      setIsSuccess(true);
    } catch (error) {
      console.error('Print failed:', error);
      setError(`${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          y: 0,
          animated: true,
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h2}>Printer Bluetooth</Text>
        <ButtonClick
          text="Connect Printer"
          onPress={() => setShowModal(true)}
        />
      </View>
      <SearchBTDevices
        showModal={showModal}
        setShowModal={setShowModal}
        setMacAddress={setMacAddress}
      />
      <InputText
        label="MAC Address"
        placeholder="MAC Address"
        value={macAddress}
        onChangeText={(text) => setMacAddress(text)}
        readonly
      />
      <BooleanChoice
        label="58mm"
        value={is58mm}
        onChange={setIs58mm}
        trueText="58mm"
        falseText="80mm"
      />
      <BooleanChoice label="Auto Cut" value={autoCut} onChange={setAutoCut} />
      <BooleanChoice
        label="Open Cashbox"
        value={openCashbox}
        onChange={setOpenCashbox}
      />
      <ButtonSubmit text="Print" onPress={handlePrint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
