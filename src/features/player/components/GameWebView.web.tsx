import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { toMessage } from '../bridge';
import type { GameWebViewHandle, GameWebViewProps } from './GameWebView.types';

/**
 * Web stand-in for the WebView (react-native-webview has no web support), used for
 * development in a browser. Same bridge protocol over window.postMessage.
 */
export const GameWebView = forwardRef<GameWebViewHandle, GameWebViewProps>(function GameWebView(
  { uri, onMessage, onLoadError },
  ref,
) {
  const frame = useRef<HTMLIFrameElement | null>(null);

  useImperativeHandle(ref, () => ({
    send: (cmd) => frame.current?.contentWindow?.postMessage(JSON.stringify(toMessage(cmd)), '*'),
  }));

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow) onMessage(e.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onMessage]);

  return createElement('iframe', {
    ref: frame,
    src: uri,
    title: 'game',
    sandbox: 'allow-scripts allow-same-origin',
    onError: () => onLoadError('Failed to load game'),
    style: { border: 0, width: '100%', height: '100%', display: 'block', background: 'transparent' },
  });
});
