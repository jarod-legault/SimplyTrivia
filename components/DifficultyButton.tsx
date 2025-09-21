import { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Difficulty } from '~/types';
import { useTheme } from '~/styles/ThemeProvider';
import { Palette, radii, shadow, spacing, ThemeMode } from '~/styles/theme';

interface Props {
  difficulty: Difficulty;
  onPress?: () => void;
}

const DifficultyButton = forwardRef<TouchableOpacity, Props>(({ difficulty, onPress }, ref) => {
  const { palette, mode } = useTheme();
  const styles = useMemo(() => createStyles(palette, mode), [palette, mode]);
  const details = getDifficultyDetails(difficulty);
  const backgroundStyle = useMemo(() => getBackgroundStyle({ styles, difficulty }), [styles, difficulty]);

  return (
    <TouchableOpacity
      ref={ref}
      activeOpacity={0.85}
      style={[styles.difficultyButtonContainer, ...backgroundStyle]}
      onPress={onPress}>
      <View style={styles.textBlock}>
        <Text style={styles.difficultyLabel}>{details.label}</Text>
        <Text style={styles.difficultyDescription}>{details.description}</Text>
      </View>
    </TouchableOpacity>
  );
});

function getBackgroundStyle({
  styles,
  difficulty,
}: {
  styles: ReturnType<typeof createStyles>;
  difficulty: Difficulty;
}) {
  if (difficulty === 'easy') {
    return [styles.easyBackground];
  } else if (difficulty === 'medium') {
    return [styles.mediumBackground];
  }

  return [styles.hardBackground];
}

function getDifficultyDetails(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return {
        label: 'Easy',
        description: 'Great for warm-ups and casual trivia time.',
      };
    case 'medium':
      return {
        label: 'Medium',
        description: 'Balanced mix of brain teasers and quick wins.',
      };
    case 'hard':
    default:
      return {
        label: 'Hard',
        description: 'For trivia pros chasing perfect streaks.',
      };
  }
}

export default DifficultyButton;

const createStyles = (palette: Palette, mode: ThemeMode) =>
  StyleSheet.create({
    difficultyButtonContainer: {
      width: '100%',
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(3),
      borderRadius: radii.lg,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surface,
      ...shadow.card,
      borderWidth: 1,
      borderColor: mode === 'light' ? palette.surfaceHighlight : palette.border,
      gap: spacing(1.5),
    },
    easyBackground: {
      borderColor: palette.easy,
    },
    mediumBackground: {
      borderColor: palette.medium,
    },
    hardBackground: {
      borderColor: palette.hard,
    },
    textBlock: {
      flex: 1,
      gap: spacing(0.5),
    },
    difficultyLabel: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.textPrimary,
      textTransform: 'none',
    },
    difficultyDescription: {
      fontSize: 15,
      color: palette.textSecondary,
    },
  });
