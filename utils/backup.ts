import fs from 'fs';
import path from 'path';

/**
 * Save question to backup JSON file for historical tracking
 */
export const saveQuestionToBackupFile = (question: any) => {
  if (!isNode()) {
    throw new Error('File system operations are only supported in Node.js environment');
  }

  try {
    const timestamp = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
    const backupDir = path.join(process.cwd(), 'data', 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `questions_${timestamp}.json`);
    let questions = [];

    // Read existing backup file if it exists
    if (fs.existsSync(backupFile)) {
      const content = fs.readFileSync(backupFile, 'utf-8');
      try {
        questions = JSON.parse(content);
      } catch (e) {
        console.error('Error parsing backup file:', e);
        questions = [];
      }
    }

    // Add the new question
    questions.push({
      ...question,
      backupTimestamp: new Date().toISOString(),
    });

    // Write back to the file
    fs.writeFileSync(backupFile, JSON.stringify(questions, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to backup question:', err);
    return false;
  }
};

/**
 * Check if code is running in a Node.js environment
 */
const isNode = () => {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
};
