import {
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import PrinterTCP from './components/PrinterTCP';
import PrinterUSB from './components/PrinterUSB';
import { useRef, useState } from 'react';
import PrinterBT from './components/PrinterBT';

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView ref={scrollRef}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {isSuccess && <Text style={styles.successText}>Print success!</Text>}
          <Text style={styles.h1}>RN Thermal Printer Example</Text>
          <PrinterTCP
            setError={setError}
            setIsSuccess={setIsSuccess}
            scrollRef={scrollRef}
          />
          <PrinterBT
            setError={setError}
            setIsSuccess={setIsSuccess}
            scrollRef={scrollRef}
          />
          <PrinterUSB
            setError={setError}
            setIsSuccess={setIsSuccess}
            scrollRef={scrollRef}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 50,
  },
  keyboardView: {
    flex: 1,
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 5,
    borderColor: '#ff0000',
    borderWidth: 1,
  },
  successText: {
    color: 'green',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: '#e6ffe6',
    padding: 10,
    borderRadius: 5,
    borderColor: '#00ff00',
    borderWidth: 1,
  },
});
