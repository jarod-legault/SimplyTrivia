import { Platform } from 'react-native';

// Import implementations
import * as mobileDb from './database.mobile';
import * as webDb from './database.web';

// Export common types and constants
export * from './database.common';

// Export platform-specific implementation
export const db = Platform.select({
  web: webDb,
  default: mobileDb,
});
