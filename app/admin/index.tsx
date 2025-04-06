import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>The admin interface is only available on the web platform.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
});
