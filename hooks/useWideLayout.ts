import { useWindowDimensions } from 'react-native';

import { wideLayoutMinWidth } from '~/styles/theme';

export function useWideLayout() {
  const { width } = useWindowDimensions();

  return width >= wideLayoutMinWidth;
}
