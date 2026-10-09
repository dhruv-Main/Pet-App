import React from 'react';
import { View } from 'react-native';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Bot,
  Brain,
  Building2,
  CalendarClock,
  Car,
  Cat,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  CreditCard,
  Cpu,
  Dog,
  FileText,
  Fingerprint,
  Footprints,
  Gift,
  HeartPulse,
  Home,
  KeyRound,
  Lightbulb,
  LifeBuoy,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Moon,
  Package,
  PawPrint,
  Pill,
  Plus,
  QrCode,
  Radio,
  ScanFace,
  ScanLine,
  Scissors,
  Search,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Siren,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  TrendingDown,
  TrendingUp,
  Undo2,
  User,
  Users,
  Utensils,
  Wallet,
  X,
  XCircle,
  Heart,
  Dna,
  Repeat,
  Truck,
  Camera,
  PenSquare,
  Wifi,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  History,
  LayoutGrid,
  RefreshCw,
  Shirt,
  Umbrella,
  Snowflake,
  Palette,
  Tag,
  Box,
  Plane,
  Zap,
  Puzzle,
  Smile,
  Video,
  GraduationCap,
  Cake,
  Ambulance,
  FolderLock,
  HandHeart,
  Megaphone,
  Crown,
  PhoneCall,
  Bookmark,
  Trophy,
  Upload,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@theme/ThemeProvider';

/** Single registry so icon usage stays consistent and tree-shakeable. */
const registry = {
  activity: Activity,
  alert: AlertTriangle,
  back: ArrowLeft,
  'arrow-up-right': ArrowUpRight,
  bell: Bell,
  bot: Bot,
  brain: Brain,
  building: Building2,
  calendar: CalendarClock,
  car: Car,
  cat: Cat,
  check: Check,
  'check-circle': CheckCircle2,
  chevron: ChevronRight,
  dot: CircleDot,
  clock: Clock,
  card: CreditCard,
  cpu: Cpu,
  dog: Dog,
  file: FileText,
  fingerprint: Fingerprint,
  footprints: Footprints,
  gift: Gift,
  'heart-pulse': HeartPulse,
  heart: Heart,
  home: Home,
  key: KeyRound,
  insight: Lightbulb,
  support: LifeBuoy,
  lock: Lock,
  mail: Mail,
  pin: MapPin,
  message: MessageCircle,
  minus: Minus,
  moon: Moon,
  package: Package,
  paw: PawPrint,
  pill: Pill,
  plus: Plus,
  qr: QrCode,
  radio: Radio,
  'scan-face': ScanFace,
  scan: ScanLine,
  scissors: Scissors,
  search: Search,
  send: Send,
  share: Share2,
  shield: ShieldCheck,
  shop: ShoppingBag,
  cart: ShoppingCart,
  siren: Siren,
  filters: SlidersHorizontal,
  phone: Smartphone,
  sparkles: Sparkles,
  star: Star,
  stethoscope: Stethoscope,
  syringe: Syringe,
  'trend-down': TrendingDown,
  'trend-up': TrendingUp,
  undo: Undo2,
  user: User,
  users: Users,
  utensils: Utensils,
  wallet: Wallet,
  close: X,
  'x-circle': XCircle,
  dna: Dna,
  repeat: Repeat,
  truck: Truck,
  camera: Camera,
  compose: PenSquare,
  wifi: Wifi,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  eye: Eye,
  'eye-off': EyeOff,
  history: History,
  layout: LayoutGrid,
  refresh: RefreshCw,
  shirt: Shirt,
  umbrella: Umbrella,
  snowflake: Snowflake,
  palette: Palette,
  tag: Tag,
  box: Box,
  plane: Plane,
  zap: Zap,
  puzzle: Puzzle,
  smile: Smile,
  video: Video,
  graduation: GraduationCap,
  cake: Cake,
  ambulance: Ambulance,
  'folder-lock': FolderLock,
  'hand-heart': HandHeart,
  megaphone: Megaphone,
  crown: Crown,
  'phone-call': PhoneCall,
  bookmark: Bookmark,
  trophy: Trophy,
  upload: Upload,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof registry;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Accessible name. When omitted the icon is decorative and hidden from assistive tech. */
  label?: string;
}

export function Icon({ name, size = 20, color, strokeWidth = 1.75, label }: IconProps) {
  const { theme } = useTheme();
  const Cmp = registry[name];
  const glyph = <Cmp size={size} color={color ?? theme.colors.text} strokeWidth={strokeWidth} />;
  if (label) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={label}>
        {glyph}
      </View>
    );
  }
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {glyph}
    </View>
  );
}

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'inverse';

export const toneColor: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: '#1865f5', bg: 'rgba(24,101,245,0.12)' },
  success: { fg: '#15803d', bg: 'rgba(34,197,94,0.14)' },
  warning: { fg: '#b45309', bg: 'rgba(245,158,11,0.16)' },
  danger: { fg: '#b91c1c', bg: 'rgba(239,68,68,0.14)' },
  neutral: { fg: '#4a5170', bg: 'rgba(107,115,144,0.14)' },
  inverse: { fg: '#ffffff', bg: 'rgba(255,255,255,0.18)' },
};

/** Icon inside a tinted rounded tile. Replaces all former emoji avatars. */
export function IconBadge({
  name,
  tone = 'primary',
  size = 40,
  iconSize,
}: {
  name: IconName;
  tone?: Tone;
  size?: number;
  iconSize?: number;
}) {
  const t = toneColor[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={iconSize ?? Math.round(size * 0.5)} color={t.fg} />
    </View>
  );
}
