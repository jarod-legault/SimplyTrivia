import { Platform } from 'react-native';
export * from './database.common';

// Export platform-specific implementation
if (Platform.OS === 'web') {
  module.exports = require('./database.web');
} else {
  module.exports = require('./database.mobile');
}
