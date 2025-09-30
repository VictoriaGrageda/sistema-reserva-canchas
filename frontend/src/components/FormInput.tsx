import React from "react";
import { TextInput, View, Text, TextInputProps } from "react-native";

type Props = TextInputProps & {
  errorText?: string | null;
};

export default function FormInput({ errorText, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: 10 }}>
      <TextInput
        {...rest}
        style={[
          {
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderColor: errorText ? "#D00" : "#CCC",
            backgroundColor: "#FFF",
          },
          style,
        ]}
      />
      {!!errorText && (
        <Text style={{ color: "#D00", marginTop: 4, fontSize: 12 }}>
          {errorText}
        </Text>
      )}
    </View>
  );
}
