import { useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { printUsb } from 'rn-thermal-printer';
import InputText from './ui/InputText';
import ButtonSubmit from './ui/ButtonSubmit';
import BooleanChoice from './ui/BooleanChoice';

interface Props {
  setError: (error: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  scrollRef: React.RefObject<ScrollView | null>;
}

export default function PrinterUSB({
  setError,
  setIsSuccess,
  scrollRef,
}: Props) {
  const [productId, setProductId] = useState('0x1234');
  const [vendorId, setVendorId] = useState('0x5678');
  const [autoCut, setAutoCut] = useState(true);
  const [openCashbox, setOpenCashbox] = useState(false);

  const payload = `[C]<b>My Cafe</b>\n[L]Americano [R]25.000\n\n[C]-- Thanks --\n`;

  const handlePrint = async () => {
    setIsSuccess(false);
    setError(null);
    try {
      await printUsb({
        productId: Number(productId),
        vendorId: Number(vendorId),
        payload,
        printerWidthMM: 80,
        charsPerLine: 48,
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
      <Text style={styles.h2}>Printer USB</Text>
      <InputText
        label="Product ID"
        placeholder="Product ID"
        value={productId}
        onChangeText={(text) => setProductId(text)}
        readonly
      />
      <InputText
        label="Vendor ID"
        placeholder="Vendor ID"
        value={vendorId}
        onChangeText={(text) => setVendorId(text)}
        readonly
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
