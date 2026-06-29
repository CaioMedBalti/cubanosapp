import { useEffect, useState } from 'react';
import { HumidorEntry } from '@/lib/firebase';
import { subscribeHumidor } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';

export function useHumidor() {
  const uid = useAuthStore((s) => s.uid);
  const [items, setItems] = useState<HumidorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeHumidor(uid, (data) => {
      setItems(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { items, loading };
}
