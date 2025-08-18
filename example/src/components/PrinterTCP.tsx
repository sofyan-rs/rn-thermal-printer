import { useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
// @ts-ignore
import { printTcp } from '@sofyan.rs/rn-thermal-printer';
import InputText from './ui/InputText';
import ButtonSubmit from './ui/ButtonSubmit';
import BooleanChoice from './ui/BooleanChoice';
import { payload } from '../utils/payload';

interface Props {
  setError: (error: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  scrollRef: React.RefObject<ScrollView | null>;
}

export default function PrinterTCP({
  setError,
  setIsSuccess,
  scrollRef,
}: Props) {
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState(9100);
  const [autoCut, setAutoCut] = useState(true);
  const [openCashbox, setOpenCashbox] = useState(false);
  const [is58mm, setIs58mm] = useState(true);

  const handlePrint = async () => {
    setIsSuccess(false);
    setError(null);
    try {
      await printTcp({
        ip: ipAddress,
        port,
        payload,
        printerWidthMM: is58mm ? 46 : 70,
        charsPerLine: is58mm ? 32 : 48,
        autoCut,
        openCashbox,
        mmFeedPaper: 40,
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
      <Text style={styles.h2}>Printer TCP</Text>
      <InputText
        label="IP Address"
        placeholder="IP Address"
        value={ipAddress}
        onChangeText={setIpAddress}
      />
      <InputText
        label="Port"
        placeholder="Port"
        value={String(port)}
        onChangeText={(text) => setPort(Number(text))}
        keyboardType="numeric"
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
});
