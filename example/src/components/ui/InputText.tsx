import { StyleSheet, Text, TextInput, View } from 'react-native';

interface InputTextProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  readonly?: boolean;
}

export default function InputText({
  label,
  value,
  onChangeText,
  placeholder = '',
  keyboardType = 'default',
  secureTextEntry = false,
  readonly = false,
}: InputTextProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        placeholderTextColor={'#888'}
        editable={!readonly}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    borderColor: '#ccc',
    borderRadius: 5,
    fontSize: 16,
    padding: 10,
  },
});
