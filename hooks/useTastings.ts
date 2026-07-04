import { useEffect, useState } from 'react';
import { Tasting } from '@/lib/firebase';
import { subscribeUserTastings } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';

export function useTastings() {
  const uid = useAuthStore((s) => s.uid);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeUserTastings(uid, (data) => {
      setTastings(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { tastings, loading };
}
