// Enhanced validation utilities

export const validation = {
  email(email: string): { valid: boolean; message?: string } {
    const trimmed = email.trim();
    
    if (!trimmed) {
      return { valid: false, message: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    
    // Check for disposable email domains (basic check)
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = trimmed.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      return { valid: false, message: 'Please use a permanent email address' };
    }
    
    return { valid: true };
  },

  phone(phone: string): { valid: boolean; message?: string; formatted?: string } {
    const cleaned = phone.replace(/\D/g, '');
    
    if (!cleaned) {
      return { valid: false, message: 'Phone number is required' };
    }
    
    if (cleaned.length !== 10) {
      return { valid: false, message: 'Please enter a valid 10-digit phone number' };
    }
    
    const formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    return { valid: true, formatted };
  },

  creditCard(cardNumber: string): { valid: boolean; message?: string; type?: string } {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (!cleaned) {
      return { valid: false, message: 'Card number is required' };
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    const luhnValid = sum % 10 === 0;
    if (!luhnValid) {
      return { valid: false, message: 'Invalid card number' };
    }
    
    // Detect card type
    const cardType = detectCardType(cleaned);
    
    return { valid: true, type: cardType };
  },

  cvv(cvv: string, cardType?: string): { valid: boolean; message?: string } {
    const cleaned = cvv.replace(/\D/g, '');
    const expectedLength = cardType === 'amex' ? 4 : 3;
    
    if (!cleaned) {
      return { valid: false, message: 'CVV is required' };
    }
    
    if (cleaned.length !== expectedLength) {
      return { valid: false, message: `CVV must be ${expectedLength} digits` };
    }
    
    return { valid: true };
  },

  expiry(expiry: string): { valid: boolean; message?: string } {
    const cleaned = expiry.replace(/\D/g, '');
    
    if (cleaned.length !== 4) {
      return { valid: false, message: 'Invalid expiry date' };
    }
    
    const month = parseInt(cleaned.slice(0, 2));
    const year = parseInt('20' + cleaned.slice(2));
    
    if (month < 1 || month > 12) {
      return { valid: false, message: 'Invalid month' };
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { valid: false, message: 'Card has expired' };
    }
    
    return { valid: true };
  },

  zipCode(zip: string): { valid: boolean; message?: string } {
    const cleaned = zip.replace(/\D/g, '');
    
    if (!cleaned) {
      return { valid: false, message: 'ZIP code is required' };
    }
    
    if (cleaned.length !== 5 && cleaned.length !== 9) {
      return { valid: false, message: 'Please enter a valid ZIP code' };
    }
    
    return { valid: true };
  },

  required(value: string, fieldName: string): { valid: boolean; message?: string } {
    const trimmed = value?.trim();
    
    if (!trimmed) {
      return { valid: false, message: `${fieldName} is required` };
    }
    
    return { valid: true };
  }
};

function detectCardType(cardNumber: string): string {
  if (/^4/.test(cardNumber)) return 'visa';
  if (/^5[1-5]/.test(cardNumber)) return 'mastercard';
  if (/^3[47]/.test(cardNumber)) return 'amex';
  if (/^6(?:011|5)/.test(cardNumber)) return 'discover';
  return 'unknown';
}

export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').slice(0, 19); // Max 16 digits + 3 spaces
}

export function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + (cleaned.length > 2 ? '/' : '') + cleaned.slice(2, 4);
  }
  return cleaned;
}
