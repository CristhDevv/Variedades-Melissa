export type Category = {
  id: string
  name: string
  slug: string
  image_url: string | null
  active: boolean
  sort_order: number
  created_at: string
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_price: number | null
  category_id: string | null
  images: string[]
  sizes: string[]
  colors: { name: string; hex: string }[]
  stock: number
  active: boolean
  featured: boolean
  meta_title: string | null
  meta_description: string | null
  social_posted: boolean
  created_at: string
  categories?: Category
}

export type Banner = {
  id: string
  title: string | null
  subtitle: string | null
  image_url: string
  link: string | null
  active: boolean
  sort_order: number
}

export type Order = {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
  department: string | null
  city: string | null
  address: string
  notes: string | null
  shipping_method: string
  shipping_cost: number
  subtotal: number
  total: number
  status: string
  coupon_code: string | null
  discount: number
  created_at: string
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  size: string | null
  color: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export type Coupon = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order: number
  max_uses: number
  used_count: number
  active: boolean
  expires_at: string | null
}

export type CartItem = {
  product: Product
  quantity: number
  size: string | null
  color: string | null
}
