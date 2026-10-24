import type { AppToGameCommand } from '@/shared';

export type GameWebViewHandle = {
  send: (cmd: AppToGameCommand) => void;
};

export type GameWebViewProps = {
  uri: string;
  /** Raw message from the game; parsed by the player through `bridge.ts`. */
  onMessage: (raw: unknown) => void;
  onLoadError: (message: string) => void;
};
