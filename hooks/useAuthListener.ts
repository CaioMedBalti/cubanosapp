import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';

// Keeps the auth store in sync with the real Firebase Auth session and the
// user's Firestore profile document. Without this, the profile shown after
// app restart / re-login is whatever was cached at registration time and
// never refreshes.
export function useAuthListener() {
  const setUid = useAuthStore((s) => s.setUid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        signOut();
        return;
      }
      setUid(user.uid);
      const profile = await getUserProfile(user.uid);
      setProfile(profile);
    });
    return unsub;
  }, [setUid, setProfile, signOut]);
}
