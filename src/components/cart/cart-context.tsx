"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "autotriz.cart.v2";

/** A cart line carries its own copy of everything it needs to render.
 *  The browser cannot reach the catalogue, and the server re-reads every
 *  price at checkout anyway, so a snapshot is both sufficient and safe. */
export type CartLine = {
  slug: string;
  name: string;
  sku: string;
  price: number;
  image: string | null;
  size: string | null;
  quantity: number;
};

/* ------------------------------------------------------------------
   The cart lives in localStorage, which makes it an external store.
   Reading it through useSyncExternalStore keeps the server render and
   the first client render in agreement, and keeps every open tab
   showing the same cart.
   ------------------------------------------------------------------ */

const EMPTY: CartLine[] = [];

let snapshot: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    const lines = parsed.flatMap((line): CartLine[] => {
      if (typeof line !== "object" || line === null) return [];
      const l = line as Partial<CartLine>;
      if (typeof l.slug !== "string" || typeof l.name !== "string") return [];
      if (!Number.isFinite(l.price) || !Number.isFinite(l.quantity)) return [];
      return [
        {
          slug: l.slug,
          name: l.name,
          sku: typeof l.sku === "string" ? l.sku : "",
          price: Math.max(0, Math.round(l.price as number)),
          image: typeof l.image === "string" ? l.image : null,
          size: typeof l.size === "string" ? l.size : null,
          quantity: Math.min(99, Math.max(1, Math.round(l.quantity as number))),
        },
      ];
    });

    return lines.length ? lines : EMPTY;
  } catch {
    return EMPTY;
  }
}

const emit = () => {
  for (const listener of listeners) listener();
};

function subscribe(listener: () => void) {
  if (!loaded) {
    loaded = true;
    snapshot = parse(window.localStorage.getItem(STORAGE_KEY));
  }
  listeners.add(listener);

  // Another tab changing the cart is a change here too.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = parse(event.newValue);
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;
const getLoaded = () => loaded;
const getLoadedOnServer = () => false;

function write(next: CartLine[]) {
  snapshot = next.length ? next : EMPTY;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  emit();
}

export type AddableProduct = Omit<CartLine, "quantity">;

type CartValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: AddableProduct, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  /* `loaded` is module state, so reading it through the same store is
     what makes an *empty* cart report that it has finished loading —
     otherwise nothing ever changes and the page waits forever. */
  const ready = useSyncExternalStore(subscribe, getLoaded, getLoadedOnServer);
  const [open, setOpen] = useState(false);

  const add = useCallback((product: AddableProduct, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find((line) => line.slug === product.slug);
    write(
      existing
        ? current.map((line) =>
            line.slug === product.slug
              ? { ...line, ...product, quantity: Math.min(99, line.quantity + quantity) }
              : line,
          )
        : [...current, { ...product, quantity }],
    );
    setOpen(true);
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    const current = getSnapshot();
    write(
      quantity < 1
        ? current.filter((line) => line.slug !== slug)
        : current.map((line) =>
            line.slug === slug
              ? { ...line, quantity: Math.min(99, quantity) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    write(getSnapshot().filter((line) => line.slug !== slug));
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
      ready,
      open,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, ready, open, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
