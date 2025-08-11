import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ButtonClickProps {
  text: string;
  onPress: () => void;
}

export default function ButtonClick({ text, onPress }: ButtonClickProps) {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={onPress} style={styles.button}>
        <Text style={styles.buttonText}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
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
