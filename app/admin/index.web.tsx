import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import CategoriesPage from './categories.web';
import QuestionsPage from './questions.web';

type AdminPage = 'questions' | 'categories';

export default function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState<AdminPage>('questions');

  const renderContent = () => {
    switch (currentPage) {
      case 'questions':
        return <QuestionsPage />;
      case 'categories':
        return <CategoriesPage />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simply Trivia: Admin Interface</Text>
      <View style={styles.navigation}>
        <Text
          style={[styles.navItem, currentPage === 'questions' && styles.navItemActive]}
          onPress={() => setCurrentPage('questions')}>
          Questions
        </Text>
        <Text
          style={[styles.navItem, currentPage === 'categories' && styles.navItemActive]}
          onPress={() => setCurrentPage('categories')}>
          Categories
        </Text>
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  navItem: {
    fontSize: 16,
    color: '#666',
    cursor: 'pointer',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  navItemActive: {
    color: '#2196F3',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
});
