import { useLocalSearchParams } from 'expo-router';

import { CollectionScreen } from '@/features/catalogue/CollectionScreen';

export default function CollectionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CollectionScreen id={id ?? ''} />;
}
