import { BRIDGE_VERSION, GameToAppSchema, type AppToGame, type AppToGameCommand, type GameToApp } from '@/shared';

/**
 * App side of the game-sdk protocol. Nothing else in the app reads or writes WebView messages.
 * Messages with an unknown protocol version or shape are ignored.
 */
export function parseGameMessage(raw: unknown): GameToApp | null {
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof data !== 'object' || data === null || (data as { v?: unknown }).v !== BRIDGE_VERSION) return null;
  const parsed = GameToAppSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export function toMessage(cmd: AppToGameCommand): AppToGame {
  return { v: BRIDGE_VERSION, ...cmd } as AppToGame;
}

/** JavaScript injected into the WebView to deliver one message to the runtime shell. */
export function toInjection(cmd: AppToGameCommand): string {
  return `window.GameReelsBridge&&window.GameReelsBridge.receive(${JSON.stringify(toMessage(cmd))});true;`;
}
