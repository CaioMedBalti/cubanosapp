import { useEffect, useState } from 'react';
import { FeedPost } from '@/lib/firebase';
import { subscribePosts } from '@/lib/firestore';

export function usePosts() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { posts, loading };
}
