import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const uid = useAuthStore((s) => s.uid);
  return uid ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
