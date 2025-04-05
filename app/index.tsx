import { Stack } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Container } from '~/components/Container';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'home', headerShown: false }} />
      <Container>
        <ScrollView>
          <View>
            <Text>Simply Trivia</Text>
          </View>
        </ScrollView>
      </Container>
    </>
  );
}
