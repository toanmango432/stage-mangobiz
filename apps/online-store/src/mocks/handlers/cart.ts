import { http, HttpResponse } from 'msw';
import { CartResponseSchema, OrderResponseSchema } from '@/types/api/schemas';

// In-memory state for cart
const cartState = {
  sessions: new Map<string, any>(),
  nextCartId: 1,
  nextOrderId: 1,
};

// Helper function to add latency and simulate errors
async function simulateLatency() {
  const latency = 100 + Math.random() * 200; // 100-300ms
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Simulate random 500 errors if MOCK_TURBULENCE is enabled
  if (__MOCK_TURBULENCE__ && Math.random() < 0.01) {
    throw new Error('Simulated server error');
  }
}

// Calculate cart totals
function calculateCartTotals(items: any[], promotionCode?: string) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Apply promotion discount
  let discount = 0;
  if (promotionCode) {
    // Demo promotion codes
    if (promotionCode === 'WELCOME20') {
      discount = subtotal * 0.20; // 20% off
    } else if (promotionCode === 'HOLIDAY25') {
      discount = Math.min(25, subtotal); // $25 off, max $25
    } else if (promotionCode === 'FRIEND15') {
      discount = subtotal * 0.15; // 15% off
    }
  }
  
  const tax = (subtotal - discount) * 0.0925; // 9.25% tax
  const total = subtotal - discount + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// Generate unique cart ID
function generateCartId(): string {
  return `550e8400-e29b-41d4-a716-${String(cartState.nextCartId++).padStart(12, '0')}`;
}

// Generate unique order ID
function generateOrderId(): string {
  return `order-${cartState.nextOrderId++}`;
}

// Generate unique order number
function generateOrderNumber(): string {
  return `ORD-${String(cartState.nextOrderId).padStart(6, '0')}`;
}

export const cartHandlers = [
  // POST /api/v1/cart/session
  http.post('/api/v1/cart/session', async () => {
    await simulateLatency();
    
    const cartId = generateCartId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const cart = {
      id: cartId,
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      currency: 'USD',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cartState.sessions.set(cartId, cart);

    const result = { data: cart };
    const validatedResult = CartResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/cart/session/:id
  http.get('/api/v1/cart/session/:id', async ({ params }) => {
    await simulateLatency();
    
    const cart = cartState.sessions.get(params.id as string);
    
    if (!cart) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Cart session not found' } },
        { status: 404 }
      );
    }

    // Check if cart has expired
    if (new Date(cart.expiresAt) < new Date()) {
      cartState.sessions.delete(params.id as string);
      return HttpResponse.json(
        { error: { code: 'EXPIRED', message: 'Cart session has expired' } },
        { status: 410 }
      );
    }

    const result = { data: cart };
    const validatedResult = CartResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // POST /api/v1/cart/items
  http.post('/api/v1/cart/items', async ({ request }) => {
    await simulateLatency();
    
    const body = await request.json() as any;
    const { cartId, item } = body;
    
    if (!cartId || !item) {
      return HttpResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'cartId and item are required' } },
        { status: 400 }
      );
    }

    const cart = cartState.sessions.get(cartId);
    
    if (!cart) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Cart session not found' } },
        { status: 404 }
      );
    }

    // Check if cart has expired
    if (new Date(cart.expiresAt) < new Date()) {
      cartState.sessions.delete(cartId);
      return HttpResponse.json(
        { error: { code: 'EXPIRED', message: 'Cart session has expired' } },
        { status: 410 }
      );
    }

    // Generate line item ID
    const lineId = `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const lineItem = {
      id: lineId,
      type: item.type,
      itemId: item.itemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      metadata: item.metadata || {},
    };

    // Add item to cart
    cart.items.push(lineItem);
    
    // Recalculate totals
    const totals = calculateCartTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.tax = totals.tax;
    cart.discount = totals.discount;
    cart.total = totals.total;
    cart.updatedAt = new Date().toISOString();

    cartState.sessions.set(cartId, cart);

    const result = { data: cart };
    const validatedResult = CartResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // PUT /api/v1/cart/items/:lineId
  http.put('/api/v1/cart/items/:lineId', async ({ params, request }) => {
    await simulateLatency();
    
    const body = await request.json() as any;
    const { cartId, quantity } = body;
    
    if (!cartId) {
      return HttpResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'cartId is required' } },
        { status: 400 }
      );
    }

    const cart = cartState.sessions.get(cartId);
    
    if (!cart) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Cart session not found' } },
        { status: 404 }
      );
    }

    // Check if cart has expired
    if (new Date(cart.expiresAt) < new Date()) {
      cartState.sessions.delete(cartId);
      return HttpResponse.json(
        { error: { code: 'EXPIRED', message: 'Cart session has expired' } },
        { status: 410 }
      );
    }

    const lineItem = cart.items.find((item: any) => item.id === params.lineId);
    
    if (!lineItem) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Line item not found' } },
        { status: 404 }
      );
    }

    // Update quantity
    lineItem.quantity = quantity;
    lineItem.total = lineItem.price * lineItem.quantity;
    
    // Recalculate totals
    const totals = calculateCartTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.tax = totals.tax;
    cart.discount = totals.discount;
    cart.total = totals.total;
    cart.updatedAt = new Date().toISOString();

    cartState.sessions.set(cartId, cart);

    const result = { data: cart };
    const validatedResult = CartResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // DELETE /api/v1/cart/items/:lineId
  http.delete('/api/v1/cart/items/:lineId', async ({ params, request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const cartId = url.searchParams.get('cartId');
    
    if (!cartId) {
      return HttpResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'cartId is required' } },
        { status: 400 }
      );
    }

    const cart = cartState.sessions.get(cartId);
    
    if (!cart) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Cart session not found' } },
        { status: 404 }
      );
    }

    // Check if cart has expired
    if (new Date(cart.expiresAt) < new Date()) {
      cartState.sessions.delete(cartId);
      return HttpResponse.json(
        { error: { code: 'EXPIRED', message: 'Cart session has expired' } },
        { status: 410 }
      );
    }

    const lineItemIndex = cart.items.findIndex((item: any) => item.id === params.lineId);
    
    if (lineItemIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Line item not found' } },
        { status: 404 }
      );
    }

    // Remove item from cart
    cart.items.splice(lineItemIndex, 1);
    
    // Recalculate totals
    const totals = calculateCartTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.tax = totals.tax;
    cart.discount = totals.discount;
    cart.total = totals.total;
    cart.updatedAt = new Date().toISOString();

    cartState.sessions.set(cartId, cart);

    const result = { data: cart };
    const validatedResult = CartResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // POST /api/v1/cart/checkout
  http.post('/api/v1/cart/checkout', async ({ request }) => {
    await simulateLatency();
    
    const body = await request.json() as any;
    const { cartId, clientInfo, paymentInfo, promotionCode } = body;
    
    if (!cartId || !clientInfo) {
      return HttpResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'cartId and clientInfo are required' } },
        { status: 400 }
      );
    }

    const cart = cartState.sessions.get(cartId);
    
    if (!cart) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Cart session not found' } },
        { status: 404 }
      );
    }

    // Check if cart has expired
    if (new Date(cart.expiresAt) < new Date()) {
      cartState.sessions.delete(cartId);
      return HttpResponse.json(
        { error: { code: 'EXPIRED', message: 'Cart session has expired' } },
        { status: 410 }
      );
    }

    // Check if cart is empty
    if (cart.items.length === 0) {
      return HttpResponse.json(
        { error: { code: 'EMPTY_CART', message: 'Cannot checkout empty cart' } },
        { status: 400 }
      );
    }

    // Recalculate totals with promotion
    const totals = calculateCartTotals(cart.items, promotionCode);
    cart.subtotal = totals.subtotal;
    cart.tax = totals.tax;
    cart.discount = totals.discount;
    cart.total = totals.total;

    // Create order
    const orderId = generateOrderId();
    const orderNumber = generateOrderNumber();

    const order = {
      id: orderId,
      orderNumber,
      status: 'confirmed' as const,
      items: cart.items.map((item: any) => ({
        id: item.id,
        type: item.type,
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      })),
      subtotal: cart.subtotal,
      tax: cart.tax,
      discount: cart.discount,
      total: cart.total,
      currency: cart.currency,
      clientInfo: clientInfo,
      paymentInfo: {
        method: paymentInfo?.method || 'card',
        status: 'completed' as const,
        transactionId: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Clear cart after successful checkout
    cartState.sessions.delete(cartId);

    const result = { data: order };
    const validatedResult = OrderResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),
];
