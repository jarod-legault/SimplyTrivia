import { Platform } from 'react-native';

// Import implementations
import * as webDb from './database.web';
import * as mobileDb from './database.mobile';

// Export common types and constants
export * from './database.common';

// Export platform-specific implementation
export const db = Platform.select({
  web: webDb,
  default: mobileDb
});
