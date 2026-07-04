import { useEffect, useState } from 'react';
import { FeedPost } from '@/lib/firebase';
import { subscribeFollowingIds, subscribeFollowingFeed } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';

export function usePosts() {
  const uid = useAuthStore((s) => s.uid);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPosts([]);
      setLoading(false);
      return;
    }

    let unsubFeed: (() => void) | undefined;

    const unsubIds = subscribeFollowingIds(uid, (followingIds) => {
      unsubFeed?.();
      unsubFeed = subscribeFollowingFeed([uid, ...followingIds], (data) => {
        setPosts(data);
        setLoading(false);
      });
    });

    return () => {
      unsubIds();
      unsubFeed?.();
    };
  }, [uid]);

  return { posts, loading };
}
