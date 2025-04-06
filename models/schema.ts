import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'questions',
      columns: [
        { name: 'question', type: 'string' },
        { name: 'correct_answer', type: 'string' },
        { name: 'incorrect_answers', type: 'string' }, // Stored as JSON string
        { name: 'category', type: 'string' },
        { name: 'difficulty', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
