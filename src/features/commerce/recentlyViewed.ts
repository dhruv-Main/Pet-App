/** In-memory list of product ids opened from the shop, newest first. Presentation only. */
const ids: string[] = [];
const wishlist = new Set<string>();

export const recentlyViewed = {
  push(id: string) {
    const i = ids.indexOf(id);
    if (i >= 0) ids.splice(i, 1);
    ids.unshift(id);
    if (ids.length > 10) ids.pop();
  },
  list: (): readonly string[] => ids,
};

export const wishlistStore = {
  has: (id: string) => wishlist.has(id),
  toggle(id: string) {
    if (wishlist.has(id)) wishlist.delete(id);
    else wishlist.add(id);
    return wishlist.has(id);
  },
};
