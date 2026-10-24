import { create } from 'zustand';

type ReelsState = {
  /** Index of the reel that is >= 60% visible; only it runs its game. */
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  /** The active reel's round is live (playing or paused): the header steps aside so the game is fully visible. */
  immersive: boolean;
  setImmersive: (immersive: boolean) => void;
};

export const useReelsStore = create<ReelsState>()((set) => ({
  activeIndex: 0,
  setActiveIndex: (activeIndex) => set({ activeIndex }),
  immersive: false,
  setImmersive: (immersive) => set({ immersive }),
}));
