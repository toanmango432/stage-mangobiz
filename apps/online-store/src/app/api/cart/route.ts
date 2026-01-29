import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Validation Schemas
// ============================================================================

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

const AddToCartSchema = z.object({
  storeId: z.string().uuid(),
  item: CartItemSchema,
});

const UpdateCartItemSchema = z.object({
  storeId: z.string().uuid(),
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const RemoveCartItemSchema = z.object({
  storeId: z.string().uuid(),
  itemId: z.string().min(1),
});

const GetCartQuerySchema = z.object({
  storeId: z.string().uuid(),
});

// ============================================================================
// Constants
// ============================================================================

const TAX_RATE = 0.1;
const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 7.99;

// ============================================================================
// Helpers
// ============================================================================

interface CartItemData {
  id: string;
  type: string;
  name: string;
  price: number;
  image?: string;
  quantity?: number;
  sku?: string;
  inStock?: boolean;
  serviceDetails?: {
    date: string;
    time: string;
    duration: number;
    staff?: string;
    addOns?: Array<{ name: string; price: number }>;
  };
  giftCardDetails?: {
    recipientName: string;
    recipientEmail: string;
    message?: string;
    design?: string;
  };
  membershipDetails?: {
    billingCycle: string;
    startDate?: string;
  };
}

function calculateCartSummary(items: CartItemData[]) {
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

  const hasPhysicalItems = items.some((item) => item.type === 'product');
  const shipping =
    hasPhysicalItems && subtotal < SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + shipping;

  return { subtotal, discount: 0, tax, shipping, total, itemCount: items.length };
}

// ============================================================================
// GET /api/cart — Get cart contents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = GetCartQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { storeId } = parsed.data;

    // Check auth — cart can be accessed by authenticated users
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to access cart',
          },
        },
        { status: 401 }
      );
    }

    // Fetch cart from online_carts table
    const { data: cart, error } = await supabase
      .from('online_carts')
      .select('*')
      .eq('store_id', storeId)
      .eq('client_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found — not an error, just empty cart
      return NextResponse.json(
        {
          error: {
            code: 'QUERY_FAILED',
            message: 'Failed to fetch cart',
            details: { supabaseError: error.message },
          },
        },
        { status: 500 }
      );
    }

    const items: CartItemData[] = cart?.items ?? [];
    const summary = calculateCartSummary(items);

    return NextResponse.json({
      data: {
        id: cart?.id ?? null,
        items,
        summary,
      },
      success: true,
    });
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

// ============================================================================
// POST /api/cart — Add item to cart
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AddToCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid cart item data',
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

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to modify cart',
          },
        },
        { status: 401 }
      );
    }

    const { storeId, item } = parsed.data;

    // Get existing cart or create new one
    const { data: existingCart } = await supabase
      .from('online_carts')
      .select('id, items')
      .eq('store_id', storeId)
      .eq('client_id', user.id)
      .single();

    let items: CartItemData[] = existingCart?.items ?? [];

    // Check for duplicate (same id and type)
    const existingIndex = items.findIndex(
      (i) => i.id === item.id && i.type === item.type
    );

    if (existingIndex > -1) {
      // Update quantity for products
      if (item.type === 'product') {
        items[existingIndex].quantity =
          (items[existingIndex].quantity || 1) + (item.quantity || 1);
      }
      // For other types, don't add duplicates
    } else {
      items = [...items, item as CartItemData];
    }

    // Upsert cart
    const { data: updatedCart, error: upsertError } = await supabase
      .from('online_carts')
      .upsert(
        {
          id: existingCart?.id ?? undefined,
          store_id: storeId,
          client_id: user.id,
          items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'store_id,client_id' }
      )
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update cart',
            details: { supabaseError: upsertError.message },
          },
        },
        { status: 500 }
      );
    }

    const summary = calculateCartSummary(items);

    return NextResponse.json(
      {
        data: {
          id: updatedCart?.id,
          items,
          summary,
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

// ============================================================================
// PUT /api/cart — Update cart item quantity
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = UpdateCartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
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

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to modify cart',
          },
        },
        { status: 401 }
      );
    }

    const { storeId, itemId, quantity } = parsed.data;

    const { data: cart, error: fetchError } = await supabase
      .from('online_carts')
      .select('id, items')
      .eq('store_id', storeId)
      .eq('client_id', user.id)
      .single();

    if (fetchError || !cart) {
      return NextResponse.json(
        {
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found',
          },
        },
        { status: 404 }
      );
    }

    const items: CartItemData[] = cart.items ?? [];
    const itemIndex = items.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) {
      return NextResponse.json(
        {
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found in cart',
          },
        },
        { status: 404 }
      );
    }

    items[itemIndex].quantity = quantity;

    const { error: updateError } = await supabase
      .from('online_carts')
      .update({ items, updated_at: new Date().toISOString() })
      .eq('id', cart.id);

    if (updateError) {
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update cart',
            details: { supabaseError: updateError.message },
          },
        },
        { status: 500 }
      );
    }

    const summary = calculateCartSummary(items);

    return NextResponse.json({
      data: {
        id: cart.id,
        items,
        summary,
      },
      success: true,
    });
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

// ============================================================================
// DELETE /api/cart — Remove item from cart
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RemoveCartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
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

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to modify cart',
          },
        },
        { status: 401 }
      );
    }

    const { storeId, itemId } = parsed.data;

    const { data: cart, error: fetchError } = await supabase
      .from('online_carts')
      .select('id, items')
      .eq('store_id', storeId)
      .eq('client_id', user.id)
      .single();

    if (fetchError || !cart) {
      return NextResponse.json(
        {
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found',
          },
        },
        { status: 404 }
      );
    }

    const items: CartItemData[] = (cart.items ?? []).filter(
      (i: CartItemData) => i.id !== itemId
    );

    const { error: updateError } = await supabase
      .from('online_carts')
      .update({ items, updated_at: new Date().toISOString() })
      .eq('id', cart.id);

    if (updateError) {
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update cart',
            details: { supabaseError: updateError.message },
          },
        },
        { status: 500 }
      );
    }

    const summary = calculateCartSummary(items);

    return NextResponse.json({
      data: {
        id: cart.id,
        items,
        summary,
      },
      success: true,
    });
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
