/**
 * Demo media catalogue. Remote photographs keyed by the same asset keys the image
 * service uses (`pets/p1/hero.jpg`, `products/pr1/primary.jpg`, ...). Images need internet access.
 */
const U = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=${w}`;

const pets: Record<string, string> = {
  p1: '1558788353-f76d92427f16',
  p2: '1605568427561-40dd23c2acea',
  p3: '1518717758536-85ae29035b6d',
  p4: '1606214174585-fe31582dc6ee',
};

const providers: Record<string, string> = {
  s1: '1612531386530-97286d97c2d2',
  s2: '1516734212186-a967f81ad0d7',
  s3: '1601758174114-e711c0cbaa69',
  s4: '1543466835-00a7907e9de1',
  s5: '1551730459-92db2a308d6a',
  s6: '1534551767192-78b8dd45b51b',
  s7: '1537151625747-768eb6cf92b2',
  s8: '1583511666372-62fc211f8377',
  s9: '1628009368231-7bb7cfcb0def',
  s10: '1507146426996-ef05306b995a',
  s11: '1503256207526-0d5d80fa2f47',
  s12: '1601758003122-53c40e686a19',
  s13: '1537151625747-768eb6cf92b2',
  s14: '1543466835-00a7907e9de1',
  s15: '1612531386530-97286d97c2d2',
  s16: '1601758174114-e711c0cbaa69',
};

const KIBBLE = '1589924691995-400dc9ecc119';
const products: Record<string, string> = {
  pr1: KIBBLE, pr2: KIBBLE, pr3: '1574158622682-e40e69881006', pr4: KIBBLE, pr5: '1574144611937-0df059b5ef3e', pr6: KIBBLE,
  pr7: '1568640347023-a616a30bc3bd', pr8: '1568640347023-a616a30bc3bd', pr9: '1495360010541-f48722b34f7d',
  pr10: '1587300003388-59208cc962cb', pr11: '1583511655857-d19b40a7a54e', pr12: '1561037404-61cd46aa615b', pr13: '1543852786-1cf6624b9987',
  pr14: '1516734212186-a967f81ad0d7', pr15: '1583511666372-62fc211f8377',
  pr16: '1601758228041-f3b2795255f1', pr17: '1601758125946-6ec2ef64daf8', pr18: '1514888286974-6c03e2ca1dba',
  pr19: '1546975490-e8b92a360b24', pr20: '1586671267731-da2cf3ceeb80', pr21: '1533738363-b7f9aef128ce',
  pr22: '1530041539828-114de669390e', pr23: '1608096299210-db7e38487075',
  pr24: '1587764379873-97837921fd44', pr25: KIBBLE, pr26: '1518791841217-8f162f1e1131',
  pr27: KIBBLE, pr28: KIBBLE, pr29: KIBBLE, pr30: KIBBLE, pr31: KIBBLE, pr32: KIBBLE, pr33: '1574144611937-0df059b5ef3e',
  pr34: '1568640347023-a616a30bc3bd', pr35: '1587300003388-59208cc962cb',
  pr36: '1608096299210-db7e38487075', pr37: '1608096299210-db7e38487075', pr38: '1608096299210-db7e38487075', pr39: '1530041539828-114de669390e', pr40: '1608096299210-db7e38487075',
  pr41: '1586671267731-da2cf3ceeb80', pr42: '1586671267731-da2cf3ceeb80', pr43: '1546975490-e8b92a360b24', pr44: '1546975490-e8b92a360b24', pr45: '1546975490-e8b92a360b24', pr46: '1518791841217-8f162f1e1131',
  pr47: '1587764379873-97837921fd44', pr48: '1587764379873-97837921fd44', pr49: '1587764379873-97837921fd44', pr50: KIBBLE,
  pr51: '1601758228041-f3b2795255f1', pr52: '1601758125946-6ec2ef64daf8', pr53: '1601758125946-6ec2ef64daf8', pr54: '1601758228041-f3b2795255f1', pr55: '1514888286974-6c03e2ca1dba',
  pr56: '1561037404-61cd46aa615b', pr57: '1561037404-61cd46aa615b', pr58: '1561037404-61cd46aa615b', pr59: '1561037404-61cd46aa615b', pr60: '1568640347023-a616a30bc3bd', pr61: '1518791841217-8f162f1e1131',
  custom: '1608096299210-db7e38487075',
};

const avatars: Record<string, string> = {
  u1: '1522276498395-f4f68f7f8454', u2: '1544717305-2782549b5136', u3: '1601758174114-e711c0cbaa69',
  u4: '1601758124510-52d02ddb7cbd', u5: '1612531386530-97286d97c2d2', u6: '1601758003122-53c40e686a19',
  u7: '1628009368231-7bb7cfcb0def', u8: '1544717305-2782549b5136', u9: '1522276498395-f4f68f7f8454',
};

const posts: Record<string, string> = {
  c1: '1552053831-71594a27632d', c2: '1574144611937-0df059b5ef3e', c3: '1558929996-da64ba858215', c4: '1628009368231-7bb7cfcb0def',
  c5: '1543466835-00a7907e9de1', c6: '1573865526739-10659fec78a5', c7: '1450778869180-41d0601e046e', c8: '1600804340584-c7db2eacf0bf',
  c9: '1534361960057-19889db9621e', c10: '1568572933382-74d440642117', c11: '1517849845537-4d257902454a', c12: '1592194996308-7b43878e84a6',
  c13: '1525253013412-55c1a69a5738', c14: '1625794084867-8ddd239946b1', c15: '1535930749574-1399327ce78f', c16: '1560807707-8cc77767d783',
};

const banners: Record<string, string> = {
  dashboard: '1558929996-da64ba858215',
  shop: '1546421845-6471bdcf3edf',
  services: '1537151625747-768eb6cf92b2',
  community: '1477884213360-7e9d7dcc1e48',
  prime: '1450778869180-41d0601e046e',
};

const services: Record<string, string> = {
  vet_teleconsult: providers.s1, vet_clinic: providers.s3, grooming: providers.s2, training: providers.s5,
  walking: providers.s6, boarding: providers.s4, pet_sitting: providers.s12, taxi: providers.s7, relocation: providers.s7, ambulance: providers.s15,
};

const TABLES: Record<string, Record<string, string>> = { pets, providers, products, avatars, posts, banners, services };

/** Hub listings reuse the catalogue photographs above by id (`p1`, `s4`, `c5`, `pr12`, `community`...). */
TABLES.hub = { ...banners, ...posts, ...products, ...providers, ...pets };

/** Resolves an asset key such as `pets/p1/hero.jpg` to a sized demo photo URL. */
export function demoImageUrl(key: string, width: number): string | undefined {
  const [kind, rawId] = key.split('/');
  const id = kind === 'products' && rawId.startsWith('custom') ? 'custom' : rawId;
  const photo = TABLES[kind]?.[id];
  return photo ? U(photo, Math.max(160, Math.min(1440, Math.round(width)))) : undefined;
}

export const demoMediaKeys = {
  banner: (name: keyof typeof banners) => `banners/${name}/banner.jpg`,
};
