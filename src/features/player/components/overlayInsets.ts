/**
 * Screen space covered by app chrome (header, tab bar, close button) on top of a full-screen game.
 * Overlays keep their content inside the uncovered area so nothing hides under the chrome.
 */
export type OverlayInsets = { top: number; bottom: number };

export const NO_INSETS: OverlayInsets = { top: 0, bottom: 0 };
