import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { palette, spacing } from '~/styles/theme';

interface Props {
  correctAnswer: string;
  disabled: boolean;
  onPress: (selectedAnswer: string) => void;
  selectedAnswer: string | null;
  thisAnswer: string;
}

function Answer({ thisAnswer, correctAnswer, disabled, onPress, selectedAnswer }: Props) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={() => onPress(thisAnswer)}
      activeOpacity={0.85}
      style={[
        styles.answerContainer,
        getAnswerBackgroundColor({
          thisAnswer,
          selectedAnswer,
          correctAnswer,
        }),
      ]}>
      <Text style={styles.answerText}>{thisAnswer}</Text>
    </TouchableOpacity>
  );
}

function getAnswerBackgroundColor({
  thisAnswer,
  selectedAnswer,
  correctAnswer,
}: {
  thisAnswer: string;
  selectedAnswer: string | null;
  correctAnswer: string;
}) {
  if (thisAnswer === selectedAnswer && thisAnswer !== correctAnswer) {
    return styles.incorrectSelectedAnswerContainer;
  } else if (!!selectedAnswer && thisAnswer === correctAnswer) {
    return styles.correctAnswerContainer;
  } else {
    return styles.unselectedAnswerContainer;
  }
}

export default Answer;

const styles = StyleSheet.create({
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    width: '100%',
    borderRadius: spacing(2),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2),
  },
  correctAnswerContainer: {
    backgroundColor: 'rgba(45, 190, 126, 0.18)',
    borderWidth: 1,
    borderColor: palette.success,
  },
  incorrectSelectedAnswerContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.16)',
    borderWidth: 1,
    borderColor: palette.error,
  },
  unselectedAnswerContainer: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.surfaceHighlight,
  },
  answerText: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
});
