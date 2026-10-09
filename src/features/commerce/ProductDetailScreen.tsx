import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AppText, Button, EmptyState, FloatingBackButton, Icon, ScreenFallback } from '@components/ui';
import type { IconName } from '@components/ui';
import { RemoteImage } from '@components/media';
import { Glass, PressableScale } from '@components/premium';
import { productAsset } from '@services/media/imageService';
import type { MediaAsset } from '@services/media/imageService';
import { demoImageUrl } from '@/demo/demo-media';
import { useProduct, useProducts, usePet } from '@services/data';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { addItem, selectCartCount } from '@features/cart/cartSlice';
import { gradients } from '@theme/tokens';
import type { Pet, Product, ProductCategory } from '@apptypes/domain';
import { ShopProductCard } from './components/ShopProductCard';
import { recentlyViewed, wishlistStore } from './recentlyViewed';
import {
  DetailSection,
  FactTile,
  HRail,
  InfoRow,
  Pill,
  RatingSummary,
  ReviewCard,
  Stars,
  Surface,
  hashOf,
} from '@features/shared/DetailKit';
import type { ReviewItem } from '@features/shared/DetailKit';

/** Gallery entry. `video` is part of the contract so a player can be dropped in later; only photos ship today. */
interface GalleryItem {
  type: 'image' | 'video';
  asset: MediaAsset;
  videoUri?: string;
}

const COMPLEMENT: Partial<Record<ProductCategory, ProductCategory[]>> = {
  food: ['treats', 'supplements'],
  treats: ['toys', 'food'],
  toys: ['treats', 'accessories'],
  grooming: ['healthcare', 'accessories'],
  healthcare: ['supplements', 'grooming'],
  supplements: ['food', 'treats'],
  accessories: ['toys', 'treats'],
  apparel: ['accessories', 'grooming'],
  devices: ['accessories', 'healthcare'],
};

const STORY: Record<ProductCategory, string> = {
  food: 'Formulated with veterinary nutritionists around real ingredients, steady energy and a healthy coat. Every batch is tested for quality before it leaves the kitchen, so each bowl is as consistent as the last.',
  treats: 'A small reward that does real work: training-friendly sizes, short ingredient lists and nothing your pet does not need. Made for the moments that matter, from the first sit to the hundredth.',
  supplements: 'Daily support built around joints, skin and digestion. Developed with vets, dosed by weight and made to be easy enough that your pet looks forward to it.',
  apparel: 'Designed around how pets actually move. Soft, breathable fabrics and clean stitching keep them comfortable on the walk and at home.',
  accessories: 'Everyday gear built to be used hard. Considered materials and a fit that holds up, from the first walk to the thousandth.',
  devices: 'Turns daily behaviour into signals you can act on. Feeds your pet’s Digital Twin so health trends show up before symptoms do.',
  toys: 'Made for the way pets really play: chewing, chasing and tugging. Tough where it needs to be, gentle on teeth and gums, and built to keep their attention.',
  healthcare: 'Practical care you can trust, chosen with vets for common everyday needs. Clear instructions and gentle formulas.',
  grooming: 'Keeps coat and skin in good shape with gentle formulas and tools that are comfortable for pets and easy for you.',
};

const FEATURES: Record<ProductCategory, { material: string; safety: string; durability: string }> = {
  food: { material: 'Real protein first, no artificial colours', safety: 'Batch tested and traceable', durability: 'Resealable pack keeps it fresh for weeks' },
  treats: { material: 'Short ingredient list, no fillers', safety: 'Batch tested and traceable', durability: 'Sealed pouch keeps treats fresh' },
  supplements: { material: 'Vet-guided active ingredients', safety: 'Made in GMP certified facilities', durability: 'Stable, long shelf life' },
  apparel: { material: 'Soft, breathable fabric', safety: 'Skin-safe dyes, no loose trims', durability: 'Reinforced stitching, machine washable' },
  accessories: { material: 'Pet-safe, non-toxic materials', safety: 'Smooth edges and secure fastenings', durability: 'Built for daily use' },
  devices: { material: 'Lightweight, skin-friendly casing', safety: 'Water-resistant, no sharp edges', durability: 'Multi-day battery, rugged build' },
  toys: { material: 'Non-toxic, BPA-free rubber', safety: 'Size-tested to avoid choking hazards', durability: 'Tough enough for strong chewers' },
  healthcare: { material: 'Gentle, vet-guided formulation', safety: 'Dermatologically tested', durability: 'Long shelf life, easy to store' },
  grooming: { material: 'Soap-free, pH balanced formulas', safety: 'Dermatologically tested', durability: 'Quality tools that stay sharp' },
};

const GOOD_FOR: Record<ProductCategory, string> = {
  food: 'Daily nutrition',
  treats: 'Training and rewards',
  supplements: 'Joints, skin and coat',
  apparel: 'Walks and cooler weather',
  accessories: 'Everyday use',
  devices: 'Health tracking',
  toys: 'Play and chewing',
  healthcare: 'Everyday care',
  grooming: 'Coat and skin care',
};

const REVIEWERS: Array<[string, string]> = [
  ['Priya M.', 'Bengaluru'],
  ['Rahul S.', 'Mumbai'],
  ['Ananya K.', 'Pune'],
  ['Vikram R.', 'Delhi'],
  ['Neha T.', 'Hyderabad'],
];

function reviewsFor(p: Product, pet: Pet | undefined): ReviewItem[] {
  const subject = pet?.name ?? 'my pet';
  const base: Array<Omit<ReviewItem, 'name' | 'when'>> = [
    { rating: 5, title: 'Exactly what we were looking for', body: `${subject} took to it straight away. The quality is clear and it has held up well over the first few weeks.`, tag: 'Verified purchase' },
    { rating: 5, title: 'Worth every rupee', body: 'Arrived quickly and well packed. Our vet suggested something similar, so we were happy to find it here.', tag: 'Verified purchase' },
    { rating: 4, title: 'Great, with one small note', body: 'Really good product overall. I would love a larger pack option, but we will be reordering.', tag: 'Verified purchase' },
    { rating: 5, title: 'A new favourite', body: `We tried a few brands before this one. ${subject} is clearly happier, and I like knowing what is in it.`, tag: 'Repeat buyer' },
  ];
  return base.map((b, i) => {
    const who = REVIEWERS[(hashOf(p.id) + i) % REVIEWERS.length];
    return {
      ...b,
      name: who[0],
      when: ['2 weeks ago', '1 month ago', '3 weeks ago', '2 months ago'][i],
      photos: i === 0 ? [productAsset(p.id, p.title)] : undefined,
    };
  });
}

function sizeClass(pet: Pet | undefined) {
  const w = pet?.weightKg ?? 0;
  if (w >= 25) return 'Large breed';
  if (w >= 10) return 'Medium breed';
  if (w > 0) return 'Small breed';
  return 'All sizes';
}

function stage(pet: Pet | undefined) {
  const m = pet?.ageMonths ?? 36;
  const young = pet?.species === 'cat' ? 'Kitten' : 'Puppy';
  return m < 12 ? young : m < 84 ? 'Adult' : 'Senior';
}

function deliveryDate(days = 2) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function ZoomViewer({ items, start, onClose }: { items: GalleryItem[]; start: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const size = Math.min(width, height - 160);
  const scale = zoomed ? 2.4 : 1;
  const item = items[index];
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#05070d' }}>
        <ScrollView
          horizontal
          key={`${index}-${zoomed}`}
          maximumZoomScale={4}
          minimumZoomScale={1}
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', minWidth: width }}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', minHeight: height - 120 }}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => setZoomed((z) => !z)}
              accessibilityRole="button"
              accessibilityLabel={zoomed ? 'Zoom out' : 'Zoom in'}
              style={{ width: size * scale, height: size * scale }}
            >
              <RemoteImage asset={item.asset} fill priority="high" />
            </Pressable>
          </ScrollView>
        </ScrollView>

        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Glass radius={20} style={{ paddingHorizontal: 14, height: 40, justifyContent: 'center' }}>
            <AppText variant="label" style={{ color: '#ffffff' }}>
              {index + 1} / {items.length}
            </AppText>
          </Glass>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close image viewer" hitSlop={8}>
            <Glass radius={22} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color="#ffffff" />
            </Glass>
          </Pressable>
        </View>

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 16, alignItems: 'center', gap: 12 }}>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {zoomed ? 'Tap to zoom out' : 'Tap image to zoom'}
          </AppText>
          <View className="flex-row" style={{ gap: 8 }}>
            {items.map((g, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  setZoomed(false);
                  setIndex(i);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Photo ${i + 1}`}
                style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: i === index ? '#ffffff' : 'transparent', opacity: i === index ? 1 : 0.6 }}
              >
                <RemoteImage asset={g.asset} fill />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ProductDetailScreen() {
  const route = useRoute<RouteProp<{ ProductDetail: { productId: string } }, 'ProductDetail'>>();
  const nav = useNavigation();
  const product = useProduct(route.params?.productId).data;

  if (!product) {
    return (
      <ScreenFallback>
        <EmptyState title="Product not found" description="This product is no longer available." actionLabel="Go back" onAction={() => nav.goBack()} />
      </ScreenFallback>
    );
  }
  return <ProductDetailContent key={product.id} product={product} />;
}

function ProductDetailContent({ product }: { product: Product }) {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const count = useAppSelector(selectCartCount);
  const all = useProducts().data;
  const pet = usePet().data;
  const petName = pet?.name ?? 'your pet';
  const species = pet?.species ?? 'dog';
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const [liked, setLiked] = useState(wishlistStore.has(product.id));
  const [added, setAdded] = useState(false);
  const [bundle, setBundle] = useState<Record<string, boolean>>({});
  const galleryRef = useRef<FlatList<GalleryItem>>(null);

  const recent = useMemo(() => recentlyViewed.list().filter((id) => id !== product.id), [product.id]);
  useEffect(() => {
    recentlyViewed.push(product.id);
  }, [product.id]);

  const heroH = Math.min(width, 520);
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const save = Math.max(0, product.mrp - product.price);
  const match = Math.min(99, 78 + (hashOf(product.id + petName) % 14) + (product.tags.some((t) => t.toLowerCase().includes(species)) ? 6 : 0));
  const freeDelivery = product.price >= 499;
  const f = FEATURES[product.category];

  const text = `${product.title} ${product.tags.join(' ')}`.toLowerCase();
  const forSpecies = /\bcat\b|kitten/.test(text) && !/\bdog\b|puppy/.test(text) ? 'Cats' : /\bdog\b|puppy/.test(text) ? 'Dogs' : 'Dogs and cats';
  const compatible = useMemo(() => {
    const other = species === 'dog' ? 'cat' : 'dog';
    return all.filter((p) => {
      const t = `${p.title} ${p.tags.join(' ')}`.toLowerCase();
      return !new RegExp(`\\b${other}\\b`).test(t) || t.includes(species);
    });
  }, [all, species]);

  const gallery = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = [{ type: 'image', asset: productAsset(product.id, product.title) }];
    const seen = new Set([demoImageUrl(items[0].asset.key, 400)]);
    for (const p of all) {
      if (items.length >= 4) break;
      if (p.id === product.id || p.category !== product.category) continue;
      const a = productAsset(p.id, `${product.title}, view ${items.length + 1}`);
      const u = demoImageUrl(a.key, 400);
      if (u && seen.has(u)) continue;
      if (u) seen.add(u);
      items.push({ type: 'image', asset: a });
    }
    return items;
  }, [all, product]);

  const together = useMemo(() => {
    const wanted = COMPLEMENT[product.category] ?? ['food', 'toys'];
    const out: Product[] = [];
    for (const cat of wanted) {
      const hit = compatible.find((p) => p.category === cat && p.id !== product.id && !out.includes(p));
      if (hit) out.push(hit);
    }
    return out;
  }, [compatible, product]);
  const bundleItems = [product, ...together.filter((p) => bundle[p.id] !== false)];
  const bundleTotal = bundleItems.reduce((s, p) => s + p.price, 0);
  const bundleMrp = bundleItems.reduce((s, p) => s + p.mrp, 0);

  const forYou = useMemo(
    () => compatible.filter((p) => p.id !== product.id && p.category !== product.category).sort((a, b) => b.rating - a.rating).slice(0, 8),
    [compatible, product],
  );
  const related = useMemo(
    () => compatible.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 8),
    [compatible, product],
  );
  const recentProducts = recent.map((id) => all.find((p) => p.id === id)).filter((p): p is Product => !!p).slice(0, 8);

  const reviews = useMemo(() => reviewsFor(product, pet), [product, pet]);
  const highlights = ['Quality', 'Value for money', `Great for ${species === 'cat' ? 'cats' : 'dogs'}`, 'Fast delivery'];

  const openProduct = useCallback(
    (id: string) => (nav as unknown as { push: (n: string, p: object) => void }).push('ProductDetail', { productId: id }),
    [nav],
  );

  const add = useCallback(() => {
    dispatch(addItem({ product }));
    setAdded(true);
    AccessibilityInfo.announceForAccessibility(`${product.title} added to cart`);
    setTimeout(() => setAdded(false), 1600);
  }, [dispatch, product]);

  const addBundle = useCallback(() => {
    bundleItems.forEach((p) => dispatch(addItem({ product: p })));
    AccessibilityInfo.announceForAccessibility(`${bundleItems.length} items added to cart`);
  }, [dispatch, bundleItems]);

  const onGalleryEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };
  const goTo = (i: number) => {
    setIndex(i);
    galleryRef.current?.scrollToOffset({ offset: i * width, animated: true });
  };

  const trust: Array<{ icon: IconName; title: string; body: string }> = [
    { icon: 'shield', title: 'Safe materials', body: f.material },
    { icon: 'stethoscope', title: 'Vet approved', body: 'Reviewed by our veterinary panel' },
    { icon: 'undo', title: 'Free returns', body: '7-day easy returns on unopened items' },
    { icon: 'truck', title: freeDelivery ? 'Free delivery' : 'Fast delivery', body: `Arrives ${deliveryDate()}${freeDelivery ? '' : ', free above ₹499'}` },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Gallery */}
        <View style={{ height: heroH, backgroundColor: '#0b0f1a' }}>
          <FlatList
            ref={galleryRef}
            data={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `g${i}`}
            onMomentumScrollEnd={onGalleryEnd}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item, index: i }) => (
              <Pressable
                onPress={() => setZoom(i)}
                accessibilityRole="imagebutton"
                accessibilityLabel={`${item.asset.alt}. Opens full screen viewer`}
                style={{ width, height: heroH }}
              >
                <RemoteImage asset={item.asset} fill priority="high" />
                {item.type === 'video' && (
                  <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -28, marginTop: -28 }}>
                    <Glass radius={28} style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="radio" size={22} color="#ffffff" />
                    </Glass>
                  </View>
                )}
              </Pressable>
            )}
          />
          <LinearGradient pointerEvents="none" colors={['rgba(11,15,26,0.35)', 'rgba(11,15,26,0)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }} />

          <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, right: 16, flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => setZoom(index)}
              accessibilityRole="button"
              accessibilityLabel="View full screen"
              hitSlop={6}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="search" size={18} color="#0b0f1a" />
            </Pressable>
            <Pressable
              onPress={() => setLiked(wishlistStore.toggle(product.id))}
              accessibilityRole="button"
              accessibilityLabel={liked ? 'Remove from wishlist' : 'Save to wishlist'}
              accessibilityState={{ selected: liked }}
              hitSlop={6}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="heart" size={18} color={liked ? '#e11d48' : '#0b0f1a'} />
            </Pressable>
          </View>

          {off > 0 && (
            <View style={{ position: 'absolute', left: 16, bottom: 56 }}>
              <View style={{ backgroundColor: '#e11d48', borderRadius: 14, paddingHorizontal: 10, height: 28, justifyContent: 'center' }}>
                <AppText variant="label" style={{ color: '#ffffff' }}>
                  {off}% off
                </AppText>
              </View>
            </View>
          )}
          <View style={{ position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center', gap: 8 }}>
            <View className="flex-row" style={{ gap: 6 }}>
              {gallery.map((_, i) => (
                <View key={i} style={{ width: i === index ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? '#ffffff' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </View>
          </View>
        </View>
        {gallery.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
            {gallery.map((g, i) => (
              <Pressable
                key={i}
                onPress={() => goTo(i)}
                accessibilityRole="button"
                accessibilityLabel={`Show photo ${i + 1}`}
                style={{ width: 60, height: 60, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: i === index ? '#1865f5' : 'transparent' }}
              >
                <RemoteImage asset={g.asset} fill />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Overview */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}>
          <AppText variant="eyebrow" className="text-primary-600 dark:text-primary-300">
            {product.brand}
          </AppText>
          <AppText variant="h1" accessibilityRole="header">
            {product.title}
          </AppText>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Stars value={product.rating} />
            <AppText variant="label">{product.rating}</AppText>
            <AppText variant="caption" muted>
              {product.reviewCount.toLocaleString('en-IN')} reviews
            </AppText>
          </View>
          <View className="flex-row items-end flex-wrap" style={{ gap: 10, marginTop: 4 }}>
            <AppText style={{ fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 }}>{inr(product.price)}</AppText>
            {off > 0 && (
              <>
                <AppText muted style={{ textDecorationLine: 'line-through', marginBottom: 4 }}>
                  {inr(product.mrp)}
                </AppText>
                <View style={{ marginBottom: 4 }}>
                  <Pill label={`You save ${inr(save)}`} tone="success" />
                </View>
              </>
            )}
          </View>
          <Surface style={{ gap: 12, marginTop: 6 }}>
            <InfoRow icon="truck" tone="success" title={`${freeDelivery ? 'Free delivery' : 'Delivery'} by ${deliveryDate()}`} body="Order within the next few hours for the fastest slot." />
            <View style={{ height: 1, backgroundColor: 'rgba(107,115,144,0.14)' }} />
            <InfoRow icon="undo" tone="primary" title="7-day free returns" body="Changed your mind? Send it back, no questions." />
          </Surface>
        </View>

        {/* AI recommendation */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <LinearGradient colors={gradients.aurora} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 20, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', right: -20, top: -20, opacity: 0.12 }}>
              <Icon name="sparkles" size={150} color="#ffffff" strokeWidth={1.25} />
            </View>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Icon name="sparkles" size={14} color="#ffffff" />
              <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Pet OS recommendation
              </AppText>
            </View>
            <AppText style={{ color: '#ffffff', fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 }}>
              {match}% match for {petName}
            </AppText>
            <View style={{ gap: 8, marginTop: 14 }}>
              {[sizeClass(pet), `${stage(pet)} life stage`, pet?.breed ? `Suits ${pet.breed}s` : 'Everyday use'].map((r) => (
                <View key={r} className="flex-row items-center" style={{ gap: 10 }}>
                  <Icon name="check-circle" size={16} color="#86efac" />
                  <AppText style={{ color: '#ffffff' }}>{r}</AppText>
                </View>
              ))}
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Icon name="check-circle" size={16} color="#86efac" />
                <AppText style={{ color: '#ffffff' }}>{GOOD_FOR[product.category]}</AppText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Subscription */}
        {product.isSubscribable && (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Surface style={{ gap: 14 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Icon name="repeat" size={18} color="#1865f5" />
                  <AppText variant="h3">Subscribe and save 10%</AppText>
                </View>
                <Pill label={inr(product.price * 0.9)} tone="primary" />
              </View>
              {[
                ['1', 'Pick a schedule', 'Every 30 days by default, change it any time.'],
                ['2', 'We deliver on time', 'Never run out. Free delivery on every order.'],
                ['3', 'Skip or cancel anytime', 'No commitment, no fees.'],
              ].map(([n, t, b]) => (
                <View key={n} className="flex-row" style={{ gap: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(24,101,245,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="caption" className="font-semibold text-primary-700 dark:text-primary-300">
                      {n}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{t}</AppText>
                    <AppText variant="caption" muted>
                      {b}
                    </AppText>
                  </View>
                </View>
              ))}
            </Surface>
          </View>
        )}

        {/* Story */}
        <DetailSection eyebrow="The story" title={`About ${product.brand}`}>
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            <AppText style={{ lineHeight: 24 }}>{STORY[product.category]}</AppText>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {product.tags.slice(0, 5).map((t) => (
                <Pill key={t} label={t} />
              ))}
            </View>
          </View>
        </DetailSection>

        {/* Perfect for */}
        <DetailSection eyebrow="Fit" title="Perfect for">
          <View className="flex-row flex-wrap" style={{ paddingHorizontal: 20, gap: 12 }}>
            <FactTile icon={species === 'cat' ? 'cat' : 'dog'} label="Pet type" value={forSpecies} />
            <FactTile icon="clock" label="Age range" value={product.category === 'food' ? 'All life stages' : 'Puppies, adults and seniors'} tone="success" />
            <FactTile icon="paw" label="Breed fit" value={pet ? `${pet.breed} and similar` : 'Most breeds'} tone="warning" />
            <FactTile icon="package" label={product.category === 'toys' ? 'Toy size' : 'Size'} value={pet ? `${sizeClass(pet)}, ${pet.weightKg ?? '--'} kg` : 'All sizes'} tone="neutral" />
          </View>
        </DetailSection>

        {/* Features */}
        <DetailSection eyebrow="Built right" title="Features">
          <View style={{ paddingHorizontal: 20 }}>
            <Surface style={{ gap: 16 }}>
              <InfoRow icon="package" title="Material" body={f.material} />
              <InfoRow icon="shield" tone="success" title="Safety" body={f.safety} />
              <InfoRow icon="star" tone="warning" title="Durability" body={f.durability} />
              <InfoRow icon="stethoscope" title="Vet recommendation" body="Suitable for everyday use as part of a balanced care routine." />
            </Surface>
          </View>
        </DetailSection>

        {/* Reviews */}
        <DetailSection eyebrow="Community" title="Ratings and reviews">
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            <Surface style={{ gap: 14 }}>
              <RatingSummary rating={product.rating} count={product.reviewCount} />
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {highlights.map((h) => (
                  <Pill key={h} label={h} icon="check" />
                ))}
              </View>
            </Surface>
          </View>
          <View style={{ height: 12 }} />
          <HRail>
            {reviews.map((r, i) => (
              <ReviewCard key={i} r={r} width={Math.min(300, width - 56)} />
            ))}
          </HRail>
        </DetailSection>

        {/* Trust */}
        <DetailSection eyebrow="Shop with confidence" title="Our promise">
          <View className="flex-row flex-wrap" style={{ paddingHorizontal: 20, gap: 12 }}>
            {trust.map((t) => (
              <FactTile key={t.title} icon={t.icon} label={t.title} value={t.body} tone="success" />
            ))}
          </View>
        </DetailSection>

        {/* Frequently bought together */}
        {together.length > 0 && (
          <DetailSection eyebrow="Bundle" title="Frequently bought together">
            <View style={{ paddingHorizontal: 20 }}>
              <Surface style={{ gap: 14 }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  {[product, ...together].map((p, i) => {
                    const on = i === 0 || bundle[p.id] !== false;
                    return (
                      <React.Fragment key={p.id}>
                        {i > 0 && <Icon name="plus" size={14} color="#6b7390" />}
                        <View style={{ flex: 1, aspectRatio: 1, borderRadius: 16, overflow: 'hidden', opacity: on ? 1 : 0.35 }}>
                          <RemoteImage asset={productAsset(p.id, p.title)} fill />
                        </View>
                      </React.Fragment>
                    );
                  })}
                </View>
                {[product, ...together].map((p, i) => {
                  const on = i === 0 || bundle[p.id] !== false;
                  return (
                    <Pressable
                      key={p.id}
                      disabled={i === 0}
                      onPress={() => setBundle((b) => ({ ...b, [p.id]: !(b[p.id] !== false) }))}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on, disabled: i === 0 }}
                      accessibilityLabel={`${p.title}, ${inr(p.price)}`}
                      className="flex-row items-center"
                      style={{ gap: 12, minHeight: 44 }}
                    >
                      <View style={{ width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#1865f5' : 'transparent', borderWidth: on ? 0 : 1.5, borderColor: '#9ca3af' }}>
                        {on && <Icon name="check" size={14} color="#ffffff" />}
                      </View>
                      <AppText variant="label" style={{ flex: 1 }} numberOfLines={1}>
                        {i === 0 ? 'This item: ' : ''}
                        {p.title}
                      </AppText>
                      <AppText variant="label">{inr(p.price)}</AppText>
                    </Pressable>
                  );
                })}
                <View className="flex-row items-center justify-between">
                  <View>
                    <AppText variant="caption" muted>
                      Total for {bundleItems.length} items
                    </AppText>
                    <View className="flex-row items-end" style={{ gap: 8 }}>
                      <AppText variant="h2">{inr(bundleTotal)}</AppText>
                      {bundleMrp > bundleTotal && (
                        <AppText variant="caption" muted style={{ textDecorationLine: 'line-through', marginBottom: 2 }}>
                          {inr(bundleMrp)}
                        </AppText>
                      )}
                    </View>
                  </View>
                  <Button label="Add all" onPress={addBundle} />
                </View>
              </Surface>
            </View>
          </DetailSection>
        )}

        {forYou.length > 0 && (
          <DetailSection eyebrow="Pet OS" title={`Recommended for ${petName}`}>
            <HRail>
              {forYou.map((p) => (
                <ShopProductCard key={p.id} product={p} width={168} onPress={() => openProduct(p.id)} match={Math.min(99, 78 + (hashOf(p.id + petName) % 14))} />
              ))}
            </HRail>
          </DetailSection>
        )}

        {recentProducts.length > 0 && (
          <DetailSection title="Recently viewed">
            <HRail>
              {recentProducts.map((p) => (
                <ShopProductCard key={p.id} product={p} width={150} onPress={() => openProduct(p.id)} />
              ))}
            </HRail>
          </DetailSection>
        )}

        {related.length > 0 && (
          <DetailSection title="Related products">
            <HRail>
              {related.map((p) => (
                <ShopProductCard key={p.id} product={p} width={168} onPress={() => openProduct(p.id)} />
              ))}
            </HRail>
          </DetailSection>
        )}
      </ScrollView>

      <FloatingBackButton />

      <View className="flex-row items-center bg-white dark:bg-surface-dark-2" style={{ padding: 14, gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(107,115,144,0.16)' }}>
        <View style={{ minWidth: 92 }} accessible accessibilityLabel={`Price ${inr(product.price)}. Cart has ${count} items`}>
          <AppText variant="h2">{inr(product.price)}</AppText>
          <AppText variant="caption" muted>
            Cart: {count} {count === 1 ? 'item' : 'items'}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <PressableScale
            onPress={add}
            accessibilityRole="button"
            accessibilityLabel="Add to cart"
            style={{ height: 52, borderRadius: 26, backgroundColor: added ? '#16a34a' : '#1865f5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          >
            <Icon name={added ? 'check' : 'cart'} size={18} color="#ffffff" />
            <AppText variant="h3" style={{ color: '#ffffff' }}>
              {added ? 'Added to cart' : 'Add to cart'}
            </AppText>
          </PressableScale>
        </View>
      </View>

      {zoom !== null && <ZoomViewer items={gallery} start={zoom} onClose={() => setZoom(null)} />}
    </SafeAreaView>
  );
}
