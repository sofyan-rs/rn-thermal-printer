import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet } from 'react-native';

export default function BooleanChoice({
  label,
  value,
  onChange,
  trueText = 'Yes',
  falseText = 'No',
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  trueText?: string;
  falseText?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceContainer}>
        <TouchableOpacity
          style={[styles.choiceButton, value ? styles.active : null]}
          onPress={() => onChange(true)}
        >
          <Text
            style={[styles.choiceText, value ? styles.choiceTextActive : null]}
          >
            {trueText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choiceButton, !value ? styles.active : null]}
          onPress={() => onChange(false)}
        >
          <Text
            style={[styles.choiceText, !value ? styles.choiceTextActive : null]}
          >
            {falseText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  choiceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  choiceButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  active: {
    backgroundColor: '#007BFF',
    borderColor: '#0056b3',
  },
  choiceText: {
    color: '#000',
    fontWeight: 'normal',
  },
  choiceTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
