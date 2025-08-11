import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ButtonSubmitProps {
  text: string;
  onPress: () => void;
}

export default function ButtonSubmit({ text, onPress }: ButtonSubmitProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
