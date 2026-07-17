import { useEffect, useState } from 'react';
import { subscribeTastingCount, subscribeFollowCounts } from '@/lib/firestore';

// publicOnly: passe true ao exibir perfil de terceiros (ver subscribeTastingCount).
export function useProfileStats(userId: string | null, publicOnly = false) {
  const [tastingCount, setTastingCount] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (!userId) {
      setTastingCount(0);
      setFollowers(0);
      setFollowing(0);
      return;
    }
    const unsubTastings = subscribeTastingCount(userId, setTastingCount, publicOnly);
    const unsubFollows = subscribeFollowCounts(userId, (c) => {
      setFollowers(c.followers);
      setFollowing(c.following);
    });
    return () => {
      unsubTastings();
      unsubFollows();
    };
  }, [userId, publicOnly]);

  return { tastingCount, followers, following };
}
