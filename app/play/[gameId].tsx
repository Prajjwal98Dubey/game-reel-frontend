import { useLocalSearchParams } from 'expo-router';

import { PlayScreen } from '@/features/player';

export default function PlayRoute() {
  const { gameId, seed } = useLocalSearchParams<{ gameId: string; seed?: string }>();
  const parsedSeed = seed != null && /^-?\d+$/.test(seed) ? Number(seed) : undefined;
  return <PlayScreen gameId={gameId ?? ''} seed={parsedSeed} />;
}
