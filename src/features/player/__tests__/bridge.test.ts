import { parseGameMessage, toInjection, toMessage } from '../bridge';

describe('parseGameMessage', () => {
  it('parses JSON strings from the WebView', () => {
    expect(parseGameMessage('{"v":1,"type":"score","score":3}')).toEqual({ v: 1, type: 'score', score: 3 });
  });

  it('accepts already-parsed objects (web iframe transport)', () => {
    expect(parseGameMessage({ v: 1, type: 'ready' })).toEqual({ v: 1, type: 'ready' });
  });

  it('parses gameOver with an optional seed', () => {
    expect(parseGameMessage({ v: 1, type: 'gameOver', score: 9, durationMs: 1200, seed: 4 })).toMatchObject({
      type: 'gameOver',
      seed: 4,
    });
  });

  it('ignores unknown protocol versions', () => {
    expect(parseGameMessage({ v: 2, type: 'ready' })).toBeNull();
  });

  it('ignores malformed or unknown messages', () => {
    expect(parseGameMessage('not json')).toBeNull();
    expect(parseGameMessage({ v: 1, type: 'teleport' })).toBeNull();
    expect(parseGameMessage({ v: 1, type: 'score' })).toBeNull();
    expect(parseGameMessage(null)).toBeNull();
  });
});

describe('app -> game', () => {
  it('stamps the protocol version', () => {
    expect(toMessage({ type: 'start', seed: 7 })).toEqual({ v: 1, type: 'start', seed: 7 });
  });

  it('builds an injection that calls the runtime bridge', () => {
    const js = toInjection({ type: 'setMuted', muted: true });
    expect(js).toContain('window.GameReelsBridge.receive({"v":1,"type":"setMuted","muted":true})');
    expect(js.endsWith('true;')).toBe(true);
  });
});
