import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * The app's one icon set: stroke icons at width 2.4 with rounded joins (§17.7), drawn from the
 * Sticker Deck design canvas. Swapping icon sets touches only this file. Icons are decorative:
 * the button or row around them carries the accessibility label.
 */
const ICONS = {
  play: { fill: true, el: <Path d="M8 5.5v13l10-6.5z" /> },
  heart: {
    el: (
      <Path d="M12 20s-7-4.3-9-8.6C1.6 8.2 3.5 4.8 7 4.8c2 0 3.4 1.1 5 2.9 1.6-1.8 3-2.9 5-2.9 3.5 0 5.4 3.4 4 6.6-2 4.3-9 8.6-9 8.6z" />
    ),
  },
  bookmark: { el: <Path d="M6.5 3.5h11v17L12 16.5l-5.5 4z" /> },
  share: { el: <Path d="M4 13v6.5h16V13M12 3.5v11M7.5 8 12 3.5 16.5 8" /> },
  search: {
    el: (
      <>
        <Circle cx={11} cy={11} r={6.5} />
        <Path d="m16 16 4 4" />
      </>
    ),
  },
  reels: {
    el: (
      <>
        <Rect x={5} y={3} width={14} height={18} rx={3} />
        <Path d="M10 9.5v5l4-2.5z" />
      </>
    ),
  },
  grid: {
    el: (
      <>
        <Rect x={4} y={4} width={7} height={7} rx={1.5} />
        <Rect x={13} y={4} width={7} height={7} rx={1.5} />
        <Rect x={4} y={13} width={7} height={7} rx={1.5} />
        <Rect x={13} y={13} width={7} height={7} rx={1.5} />
      </>
    ),
  },
  chevronUp: { el: <Path d="m6 15 6-6 6 6" /> },
  chevronLeft: { el: <Path d="m15 6-6 6 6 6" /> },
  close: { el: <Path d="M6 6l12 12M18 6 6 18" /> },
  replay: { el: <Path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" /> },
  dragX: { el: <Path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" /> },
  tap: {
    el: (
      <>
        <Circle cx={12} cy={12} r={3} />
        <Circle cx={12} cy={12} r={7.5} />
      </>
    ),
  },
  volume: { el: <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> },
  volumeOff: { el: <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5" /> },
  alert: {
    el: (
      <>
        <Circle cx={12} cy={12} r={8.5} />
        <Path d="M12 7.5v5.5M12 16.2v.3" />
      </>
    ),
  },
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  /** Fills the shape too (liked heart, saved bookmark). `play` is always filled. */
  filled?: boolean;
};

export function Icon({ name, size = 20, color = colors.ink, filled = false }: Props) {
  const icon = ICONS[name];
  const solid = filled || ('fill' in icon && icon.fill);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? color : 'none'}
      stroke={color}
      strokeWidth={name === 'play' ? 0 : 2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon.el}
    </Svg>
  );
}
