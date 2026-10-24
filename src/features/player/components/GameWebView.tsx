import { forwardRef, useImperativeHandle, useRef, type ComponentRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { colors } from '@/theme';

import { toInjection } from '../bridge';
import type { GameWebViewHandle, GameWebViewProps } from './GameWebView.types';

/**
 * Hosts one game bundle. Configured so the page cannot scroll, zoom or navigate away,
 * and vertical drags fall through to the feed (gesture rule 1).
 */
export const GameWebView = forwardRef<GameWebViewHandle, GameWebViewProps>(function GameWebView(
  { uri, onMessage, onLoadError },
  ref,
) {
  const webview = useRef<ComponentRef<typeof WebView>>(null);
  const bundleDir = uri.slice(0, uri.lastIndexOf('/') + 1);

  useImperativeHandle(ref, () => ({
    send: (cmd) => webview.current?.injectJavaScript(toInjection(cmd)),
  }));

  return (
    <WebView
      ref={webview}
      source={{ uri }}
      style={styles.webview}
      containerStyle={styles.webview}
      originWhitelist={['*']}
      onMessage={(e: WebViewMessageEvent) => onMessage(e.nativeEvent.data)}
      onError={(e) => onLoadError(e.nativeEvent.description)}
      onHttpError={(e) => onLoadError(`HTTP ${e.nativeEvent.statusCode}`)}
      onShouldStartLoadWithRequest={(req): boolean => req.url.startsWith(bundleDir) || req.url.startsWith('about:')}
      onContentProcessDidTerminate={() => webview.current?.reload()}
      onRenderProcessGone={() => webview.current?.reload()}
      javaScriptEnabled
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      nestedScrollEnabled={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      setSupportMultipleWindows={false}
      setBuiltInZoomControls={false}
      textZoom={100}
      allowsInlineMediaPlayback
      allowsLinkPreview={false}
      androidLayerType="hardware"
      webviewDebuggingEnabled={__DEV__}
    />
  );
});

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: colors.surface },
});
