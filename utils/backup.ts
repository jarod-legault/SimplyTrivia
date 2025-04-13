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
    // Get current date in local timezone
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const timestamp = localDate.toISOString().split('T')[0]; // YYYY-MM-DD in local timezone
    
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

    // Add the new question with both UTC and local timestamps
    questions.push({
      ...question,
      backupTimestamp: now.toISOString(),
      localBackupTimestamp: localDate.toISOString(),
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
