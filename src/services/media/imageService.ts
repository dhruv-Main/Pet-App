import { Image } from 'expo-image';
import { DEMO_MODE } from '@/demo/demoMode';
import { demoImageUrl } from '@/demo/demo-media';

/**
 * Central image pipeline. Every remote image in the app resolves through here so
 * CDN sizing, placeholders and caching policy stay consistent.
 *
 * Set EXPO_PUBLIC_MEDIA_CDN to an image-resizing CDN (imgix, Cloudinary, Cloudflare
 * Images style `?w=&q=&fm=` params). When unset, components render the blur-up
 * placeholder surface only; no network request is made.
 */
const CDN_BASE = process.env.EXPO_PUBLIC_MEDIA_CDN?.replace(/\/$/, '');

export type CachePolicy = 'memory-disk' | 'disk' | 'memory' | 'none';
export const DEFAULT_CACHE_POLICY: CachePolicy = 'memory-disk';

/** Neutral, valid blurhash placeholders. */
export const blurhash = {
  neutral: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  warm: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
} as const;

export interface MediaAsset {
  /** CDN-relative key, e.g. `pets/p1/hero.jpg`. */
  key: string;
  blurhash: string;
  /** width / height */
  aspectRatio: number;
  /** Accessible description. */
  alt: string;
}

const WIDTH_STEPS = [160, 320, 480, 640, 828, 1080, 1440];

function snapWidth(width: number, scale: number): number {
  const target = Math.max(1, Math.round(width * scale));
  return WIDTH_STEPS.find((w) => w >= target) ?? WIDTH_STEPS[WIDTH_STEPS.length - 1];
}

/** Resolves an asset to a sized CDN URL, or undefined if no CDN is configured. */
export function resolveImageUri(
  asset: Pick<MediaAsset, 'key'>,
  opts: { width: number; pixelRatio?: number; quality?: number },
): string | undefined {
  if (DEMO_MODE && !CDN_BASE) {
    return demoImageUrl(asset.key, snapWidth(opts.width, opts.pixelRatio ?? 2));
  }
  if (!CDN_BASE) return undefined;
  const w = snapWidth(opts.width, opts.pixelRatio ?? 2);
  const q = opts.quality ?? 75;
  return `${CDN_BASE}/${asset.key}?w=${w}&q=${q}&fm=webp`;
}

export async function prefetchAssets(assets: MediaAsset[], width = 640): Promise<void> {
  const urls = assets
    .map((a) => resolveImageUri(a, { width }))
    .filter((u): u is string => !!u);
  if (urls.length === 0) return;
  try {
    await Image.prefetch(urls, DEFAULT_CACHE_POLICY === 'memory-disk' ? 'memory-disk' : 'disk');
  } catch {
    // Prefetch is best effort.
  }
}

export function petHeroAsset(petId: string, name: string, species: 'dog' | 'cat'): MediaAsset {
  return {
    key: `pets/${petId}/hero.jpg`,
    blurhash: species === 'dog' ? blurhash.warm : blurhash.neutral,
    aspectRatio: 4 / 3,
    alt: `Photo of ${name}`,
  };
}

export function productAsset(id: string, name: string): MediaAsset {
  return {
    key: `products/${id}/primary.jpg`,
    blurhash: blurhash.neutral,
    aspectRatio: 1,
    alt: name,
  };
}

export function avatarAsset(userId: string, name: string): MediaAsset {
  return { key: `avatars/${userId}/avatar.jpg`, blurhash: blurhash.neutral, aspectRatio: 1, alt: `Photo of ${name}` };
}

export function postAsset(postId: string, alt: string): MediaAsset {
  return { key: `posts/${postId}/photo.jpg`, blurhash: blurhash.warm, aspectRatio: 4 / 3, alt };
}

export function hubAsset(id: string, alt: string, aspectRatio = 4 / 3): MediaAsset {
  return { key: `hub/${id}/photo.jpg`, blurhash: blurhash.warm, aspectRatio, alt };
}

export function bannerAsset(name: string, alt: string): MediaAsset {
  return { key: `banners/${name}/banner.jpg`, blurhash: blurhash.warm, aspectRatio: 16 / 7, alt };
}

export function serviceAsset(type: string, alt: string): MediaAsset {
  return { key: `services/${type}/cover.jpg`, blurhash: blurhash.warm, aspectRatio: 16 / 9, alt };
}

export function providerAsset(id: string, name: string): MediaAsset {
  return {
    key: `providers/${id}/cover.jpg`,
    blurhash: blurhash.warm,
    aspectRatio: 16 / 9,
    alt: name,
  };
}
