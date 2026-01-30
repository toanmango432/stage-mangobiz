import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Validation Schemas
// ============================================================================

const ShippingAddressSchema = z.object({
  fullName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
});

const CartItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['product', 'service', 'membership', 'gift-card']),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  image: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  sku: z.string().optional(),
  inStock: z.boolean().optional(),
  serviceDetails: z
    .object({
      date: z.string(),
      time: z.string(),
      duration: z.number().positive(),
      staff: z.string().optional(),
      addOns: z
        .array(z.object({ name: z.string(), price: z.number().nonnegative() }))
        .optional(),
    })
    .optional(),
  giftCardDetails: z
    .object({
      recipientName: z.string().min(1),
      recipientEmail: z.string().email(),
      message: z.string().optional(),
      design: z.string().optional(),
    })
    .optional(),
  membershipDetails: z
    .object({
      billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
      startDate: z.string().optional(),
    })
    .optional(),
});

const CheckoutSchema = z.object({
  storeId: z.string().uuid(),
  items: z.array(CartItemSchema).min(1, 'Cart cannot be empty'),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  shippingType: z.enum(['shipping', 'pickup']),
  shippingAddress: ShippingAddressSchema.optional(),
  billingAddress: ShippingAddressSchema.optional(),
  paymentMethod: z.object({
    type: z.string().min(1),
    last4: z.string().length(4),
  }),
  promoCode: z.string().optional(),
  pickupLocation: z.string().optional(),
  pickupTime: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// Constants
// ============================================================================

const TAX_RATE = 0.1;
const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 7.99;

const PROMO_CODES: Record<string, { type: string; value: number; minPurchase: number }> = {
  WELCOME10: { type: 'percent', value: 10, minPurchase: 0 },
  SAVE20: { type: 'percent', value: 20, minPurchase: 100 },
  FREESHIP: { type: 'shipping', value: 0, minPurchase: 0 },
  SPRING25: { type: 'fixed', value: 25, minPurchase: 75 },
};

// ============================================================================
// Helpers
// ============================================================================

interface CartItemForCalc {
  type: string;
  price: number;
  quantity?: number;
  serviceDetails?: {
    addOns?: Array<{ price: number }>;
  };
}

function calculateServerTotals(
  items: CartItemForCalc[],
  promoCode?: string
) {
  const subtotal = items.reduce((total, item) => {
    const itemTotal = item.price * (item.quantity || 1);
    if (item.serviceDetails?.addOns) {
      const addOnsTotal = item.serviceDetails.addOns.reduce(
        (sum, addOn) => sum + addOn.price,
        0
      );
      return total + itemTotal + addOnsTotal;
    }
    return total + itemTotal;
  }, 0);

  let discount = 0;
  if (promoCode) {
    const promo = PROMO_CODES[promoCode.toUpperCase()];
    if (promo && subtotal >= promo.minPurchase) {
      if (promo.type === 'percent') {
        discount = subtotal * (promo.value / 100);
      } else if (promo.type === 'fixed') {
        discount = promo.value;
      }
    }
  }

  const hasPhysicalItems = items.some((item) => item.type === 'product');
  let shipping = 0;
  if (hasPhysicalItems) {
    if (promoCode?.toUpperCase() === 'FREESHIP') {
      shipping = 0;
    } else {
      shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    }
  }

  const tax = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + tax + shipping;

  return { subtotal, discount, tax, shipping, total };
}

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

// ============================================================================
// POST /api/checkout — Process order
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid checkout data',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      storeId,
      items,
      customerEmail,
      customerPhone,
      shippingType,
      shippingAddress,
      billingAddress,
      paymentMethod,
      promoCode,
      pickupLocation,
      pickupTime,
      notes,
    } = parsed.data;

    // Require shipping address for shipping orders
    if (shippingType === 'shipping') {
      const hasPhysicalItems = items.some((item) => item.type === 'product');
      if (hasPhysicalItems && !shippingAddress) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Shipping address is required for physical items',
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate promo code if provided
    if (promoCode) {
      const promo = PROMO_CODES[promoCode.toUpperCase()];
      if (!promo) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_PROMO',
              message: 'Invalid promo code',
            },
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals server-side (never trust client-calculated totals)
    const totals = calculateServerTotals(items as CartItemForCalc[], promoCode);

    // Generate order
    const orderNumber = generateOrderNumber();
    const orderId = crypto.randomUUID();

    const order = {
      id: orderId,
      order_number: orderNumber,
      store_id: storeId,
      client_id: user?.id ?? null,
      status: 'processing' as const,
      items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      shipping: totals.shipping,
      total: totals.total,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress ?? null,
      billing_address: billingAddress ?? shippingAddress ?? null,
      payment_method: paymentMethod,
      promo_code: promoCode ?? null,
      pickup_location: pickupLocation ?? null,
      pickup_time: pickupTime ?? null,
      notes: notes ?? null,
    };

    // Insert order into database
    const { data: createdOrder, error: insertError } = await supabase
      .from('online_orders')
      .insert(order)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: {
            code: 'ORDER_FAILED',
            message: 'Failed to create order',
            details: { supabaseError: insertError.message },
          },
        },
        { status: 500 }
      );
    }

    // Clear cart after successful order
    if (user) {
      await supabase
        .from('online_carts')
        .delete()
        .eq('store_id', storeId)
        .eq('client_id', user.id);
    }

    return NextResponse.json(
      {
        data: {
          id: createdOrder?.id ?? orderId,
          orderNumber: createdOrder?.order_number ?? orderNumber,
          date: new Date().toISOString(),
          status: 'processing',
          items,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          shipping: totals.shipping,
          total: totals.total,
          customerEmail,
          customerPhone,
          shippingAddress: shippingAddress ?? null,
          billingAddress: billingAddress ?? shippingAddress ?? null,
          paymentMethod,
          promoCode: promoCode ?? null,
          pickupLocation: pickupLocation ?? null,
          pickupTime: pickupTime ?? null,
          notes: notes ?? null,
        },
        success: true,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
