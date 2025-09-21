import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '~/styles/ThemeProvider';
import { Palette, spacing, ThemeMode } from '~/styles/theme';

interface Props {
  correctAnswer: string;
  disabled: boolean;
  onPress: (selectedAnswer: string) => void;
  selectedAnswer: string | null;
  thisAnswer: string;
}

function Answer({ thisAnswer, correctAnswer, disabled, onPress, selectedAnswer }: Props) {
  const { palette, mode } = useTheme();
  const styles = useMemo(() => createStyles(palette, mode), [palette, mode]);
  const backgroundStyle = useMemo(
    () => {
      if (thisAnswer === selectedAnswer && thisAnswer !== correctAnswer) {
        return styles.incorrectSelectedAnswerContainer;
      }

      if (!!selectedAnswer && thisAnswer === correctAnswer) {
        return styles.correctAnswerContainer;
      }

      return styles.unselectedAnswerContainer;
    },
    [styles, thisAnswer, selectedAnswer, correctAnswer]
  );

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={() => onPress(thisAnswer)}
      activeOpacity={0.85}
      style={[styles.answerContainer, backgroundStyle]}>
      <Text style={styles.answerText}>{thisAnswer}</Text>
    </TouchableOpacity>
  );
}

export default Answer;

const createStyles = (palette: Palette, mode: ThemeMode) =>
  StyleSheet.create({
    answerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1.5),
      width: '100%',
      borderRadius: spacing(2),
      paddingVertical: spacing(2),
      paddingHorizontal: spacing(2),
      backgroundColor: palette.surface,
    },
    correctAnswerContainer: {
      backgroundColor: mode === 'dark' ? 'rgba(45, 190, 126, 0.18)' : 'rgba(45, 190, 126, 0.12)',
      borderColor: palette.success,
      borderWidth: 1,
    },
    incorrectSelectedAnswerContainer: {
      backgroundColor: mode === 'dark' ? 'rgba(255, 107, 107, 0.16)' : 'rgba(233, 68, 68, 0.12)',
      borderColor: palette.error,
      borderWidth: 1,
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
