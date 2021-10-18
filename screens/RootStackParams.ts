import {difficultyType} from './QuestionScreen';

export type RootStackParamList = {
  Home: undefined;
  Question: {difficulty: difficultyType, OTDBToken: string};
};
