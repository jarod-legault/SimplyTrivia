import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CategoriesPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Categories management is only available in the web version.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
