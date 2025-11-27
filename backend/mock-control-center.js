const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock license validation endpoint
app.post('/api/validate-license', (req, res) => {
  const { licenseKey, appVersion, deviceInfo } = req.body;

  console.log('📋 License validation request:', {
    licenseKey,
    appVersion,
    deviceInfo,
  });

  // Accept any license key for development
  if (!licenseKey) {
    return res.status(400).json({
      valid: false,
      status: 'inactive',
      message: 'License key is required',
    });
  }

  // Return successful validation with mock defaults
  const response = {
    valid: true,
    storeId: 'dev_store_001',
    tier: 'premium',
    status: 'active',
    message: 'License activated successfully (DEV MODE)',
    defaults: {
      taxSettings: [
        {
          name: 'Sales Tax',
          rate: 8.5,
          isDefault: true,
        },
        {
          name: 'GST',
          rate: 5.0,
          isDefault: false,
        },
      ],
      categories: [
        {
          name: 'Manicure',
          icon: '💅',
          color: '#FF6B9D',
        },
        {
          name: 'Pedicure',
          icon: '🦶',
          color: '#4ECDC4',
        },
        {
          name: 'Waxing',
          icon: '✨',
          color: '#FFE66D',
        },
        {
          name: 'Facial',
          icon: '😊',
          color: '#A8E6CF',
        },
      ],
      items: [
        {
          name: 'Basic Manicure',
          category: 'Manicure',
          description: 'Filing, shaping, cuticle care, buffing, and regular polish',
          duration: 30,
          price: 20,
          commissionRate: 50,
        },
        {
          name: 'Gel Manicure',
          category: 'Manicure',
          description: 'Premium gel polish with long-lasting shine',
          duration: 45,
          price: 35,
          commissionRate: 50,
        },
        {
          name: 'Basic Pedicure',
          category: 'Pedicure',
          description: 'Foot soak, nail trim, cuticle care, and polish',
          duration: 45,
          price: 30,
          commissionRate: 50,
        },
        {
          name: 'Spa Pedicure',
          category: 'Pedicure',
          description: 'Deluxe treatment with massage and exfoliation',
          duration: 60,
          price: 45,
          commissionRate: 50,
        },
      ],
      employeeRoles: [
        {
          name: 'Manager',
          permissions: ['all'],
          color: '#10B981',
        },
        {
          name: 'Technician',
          permissions: ['create_ticket', 'checkout', 'view_schedule'],
          color: '#3B82F6',
        },
        {
          name: 'Receptionist',
          permissions: ['create_ticket', 'view_schedule'],
          color: '#8B5CF6',
        },
      ],
      paymentMethods: [
        {
          name: 'Cash',
          type: 'cash',
          isActive: true,
        },
        {
          name: 'Credit Card',
          type: 'card',
          isActive: true,
        },
        {
          name: 'Debit Card',
          type: 'card',
          isActive: true,
        },
        {
          name: 'Other',
          type: 'other',
          isActive: true,
        },
      ],
    },
    requiredVersion: '1.0.0',
    expiresAt: '2026-12-31T23:59:59Z',
  };

  console.log('✅ License validated successfully (MOCK)');
  res.json(response);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mock Control Center',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🎭 ================================');
  console.log('🎭 Mock Control Center (Dev Mode)');
  console.log('🎭 ================================');
  console.log('');
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Validation endpoint: POST http://localhost:${PORT}/api/validate-license`);
  console.log('');
  console.log('📝 Any license key will be accepted in this mock mode');
  console.log('');
});
