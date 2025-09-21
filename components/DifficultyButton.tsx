import { forwardRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Difficulty } from '~/types';
import { palette, radii, shadow, spacing } from '~/styles/theme';

interface Props {
  difficulty: Difficulty;
  onPress?: () => void;
}

const DifficultyButton = forwardRef<TouchableOpacity, Props>(({ difficulty, onPress }, ref) => {
  const details = getDifficultyDetails(difficulty);

  return (
    <TouchableOpacity
      ref={ref}
      activeOpacity={0.85}
      style={[styles.difficultyButtonContainer, getBackgroundStyle(difficulty)]}
      onPress={onPress}>
      <View style={styles.badgeBlock}>
        <View style={[styles.difficultyBadge, getBadgeStyle(difficulty)]}>
          <Text style={styles.badgeText}>{details.badge}</Text>
        </View>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.difficultyLabel}>{details.label}</Text>
        <Text style={styles.difficultyDescription}>{details.description}</Text>
      </View>
    </TouchableOpacity>
  );
});

function getBackgroundStyle(difficulty: Difficulty) {
  if (difficulty === 'easy') {
    return styles.easyBackground;
  } else if (difficulty === 'medium') {
    return styles.mediumBackground;
  }

  return styles.hardBackground;
}

function getDifficultyDetails(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return {
        label: 'Easy',
        description: 'Great for warm-ups and casual trivia time.',
        badge: 'E',
      };
    case 'medium':
      return {
        label: 'Medium',
        description: 'Balanced mix of brain teasers and quick wins.',
        badge: 'M',
      };
    case 'hard':
    default:
      return {
        label: 'Hard',
        description: 'For trivia pros chasing perfect streaks.',
        badge: 'H',
      };
  }
}

function getBadgeStyle(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return styles.easyBadge;
    case 'medium':
      return styles.mediumBadge;
    case 'hard':
    default:
      return styles.hardBadge;
  }
}

export default DifficultyButton;

const styles = StyleSheet.create({
  difficultyButtonContainer: {
    width: '100%',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(3),
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    ...shadow.card,
  },
  easyBackground: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.easy,
  },
  mediumBackground: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.medium,
  },
  hardBackground: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.hard,
  },
  badgeBlock: {
    justifyContent: 'center',
  },
  difficultyBadge: {
    height: spacing(5),
    width: spacing(5),
    borderRadius: spacing(2.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  easyBadge: {
    backgroundColor: 'rgba(45, 190, 126, 0.18)',
    borderWidth: 1,
    borderColor: palette.easy,
  },
  mediumBadge: {
    backgroundColor: 'rgba(74, 168, 255, 0.16)',
    borderWidth: 1,
    borderColor: palette.medium,
  },
  hardBadge: {
    backgroundColor: 'rgba(243, 156, 87, 0.18)',
    borderWidth: 1,
    borderColor: palette.hard,
  },
  badgeText: {
    color: palette.textPrimary,
    fontWeight: '700',
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
