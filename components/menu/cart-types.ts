export type OrderableItem = {
  id: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
};

export type OrderableGroup = {
  category: string;
  label: string;
  items: OrderableItem[];
};

/** A line in the cart: the item plus its chosen quantity and optional note. */
export type CartLine = {
  item: OrderableItem;
  quantity: number;
  note: string;
};

export const MAX_QTY = 10;
export const MAX_ITEMS = 20;
