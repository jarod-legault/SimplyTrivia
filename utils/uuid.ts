import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique UUID
 */
export const generateUUID = (): string => {
  return uuidv4();
};
