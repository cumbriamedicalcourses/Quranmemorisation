import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number;
}

const stroke = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function BackIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 6l-6 6 6 6" stroke={color} {...stroke} />
    </Svg>
  );
}

export function SettingsIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke={color} {...stroke} />
      <Circle cx={16} cy={7} r={2} stroke={color} {...stroke} />
      <Circle cx={10} cy={17} r={2} stroke={color} {...stroke} />
    </Svg>
  );
}

export function PlusIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5v14M5 12h14" stroke={color} {...stroke} />
    </Svg>
  );
}

export function ReviseIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 12a8 8 0 1 0 2.5-5.8" stroke={color} {...stroke} />
      <Path d="M4 4v4h4" stroke={color} {...stroke} />
    </Svg>
  );
}

export function BookIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" stroke={color} {...stroke} />
      <Path d="M5 17a3 3 0 0 1 3-3h11" stroke={color} {...stroke} />
    </Svg>
  );
}

export function CheckIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12l5 5 9-10" stroke={color} {...stroke} strokeWidth={2} />
    </Svg>
  );
}

export function HeadphonesIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 15v-3a8 8 0 0 1 16 0v3" stroke={color} {...stroke} />
      <Path d="M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z" stroke={color} {...stroke} />
    </Svg>
  );
}
