import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Platform } from 'react-native';

import { Container } from '~/components/Container';

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && Platform.OS === 'web') {
      router.replace('./admin');
    }
  }, [isMounted]);

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
