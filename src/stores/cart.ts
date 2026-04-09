import { atom } from 'nanostores'

export interface CartItem {
  productId: string
  name: string
  price_cents: number
  quantity: number
  image_url?: string
  partner_name?: string
}

// Persisté en localStorage
function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('natics_cart')
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('natics_cart', JSON.stringify(items))
}

export const $cart = atom<CartItem[]>(loadCart())

export function addToCart(item: CartItem) {
  const current = $cart.get()
  const existing = current.find((i) => i.productId === item.productId)
  let next: CartItem[]
  if (existing) {
    next = current.map((i) =>
      i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
    )
  } else {
    next = [...current, item]
  }
  $cart.set(next)
  saveCart(next)
}

export function removeFromCart(productId: string) {
  const next = $cart.get().filter((i) => i.productId !== productId)
  $cart.set(next)
  saveCart(next)
}

export function updateQty(productId: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(productId)
    return
  }
  const next = $cart.get().map((i) => (i.productId === productId ? { ...i, quantity } : i))
  $cart.set(next)
  saveCart(next)
}

export function clearCart() {
  $cart.set([])
  saveCart([])
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0)
}
