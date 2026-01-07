interface CardData {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  userId: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  createdAt: string;
}

const PAYMENT_METHODS_KEY = 'mango-payment-methods';

const luhnCheck = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\s/g, '').split('').map(Number);
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

const getCardBrand = (cardNumber: string): string => {
  const number = cardNumber.replace(/\s/g, '');
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6(?:011|5)/.test(number)) return 'discover';
  return 'unknown';
};

export const mockPaymentApi = {
  validateCard: (cardData: CardData): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const cleanNumber = cardData.number.replace(/\s/g, '');

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      errors.push('Card number must be 13-19 digits');
    } else if (!luhnCheck(cleanNumber)) {
      errors.push('Invalid card number');
    }

    const [month, year] = cardData.expiry.split('/').map(s => s.trim());
    const expMonth = parseInt(month);
    const expYear = parseInt(`20${year}`);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!month || !year || expMonth < 1 || expMonth > 12) {
      errors.push('Invalid expiry date format (MM/YY)');
    } else if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      errors.push('Card has expired');
    }

    const brand = getCardBrand(cleanNumber);
    const expectedCvcLength = brand === 'amex' ? 4 : 3;
    if (cardData.cvc.length !== expectedCvcLength) {
      errors.push(`CVC must be ${expectedCvcLength} digits for ${brand}`);
    }

    if (!cardData.name.trim() || cardData.name.length < 3) {
      errors.push('Cardholder name is required');
    }

    return { valid: errors.length === 0, errors };
  },

  createSetupIntent: async (): Promise<{ success: boolean; clientSecret?: string; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (Math.random() < 0.05) {
      return { success: false, error: 'Payment processor temporarily unavailable' };
    }
    const clientSecret = `seti_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { success: true, clientSecret };
  },

  savePaymentMethod: async (
    userId: string,
    cardData: CardData,
    billingAddress: any
  ): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const validation = mockPaymentApi.validateCard(cardData);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    if (Math.random() < 0.05) {
      return { success: false, error: 'Card declined by issuer' };
    }

    const cleanNumber = cardData.number.replace(/\s/g, '');
    const [month, year] = cardData.expiry.split('/').map(s => s.trim());

    const paymentMethod: PaymentMethod = {
      id: `pm_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      last4: cleanNumber.slice(-4),
      brand: getCardBrand(cleanNumber),
      expiryMonth: month,
      expiryYear: year,
      createdAt: new Date().toISOString(),
    };

    const methods = mockPaymentApi.getAllPaymentMethods();
    methods.push(paymentMethod);
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(methods));
    console.log('💳 Payment method saved:', paymentMethod);

    return { success: true, paymentMethodId: paymentMethod.id };
  },

  getAllPaymentMethods: (): PaymentMethod[] => {
    const data = localStorage.getItem(PAYMENT_METHODS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getUserPaymentMethods: (userId: string): PaymentMethod[] => {
    const methods = mockPaymentApi.getAllPaymentMethods();
    return methods.filter(m => m.userId === userId);
  },
};
