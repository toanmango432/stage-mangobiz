/**
 * Test helpers and mock data generators
 */

export const generateMockUser = (overrides = {}) => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: 'test@example.com',
  name: 'Test User',
  phone: '555-1234',
  ...overrides,
});

export const generateMockOrder = (overrides = {}) => ({
  id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  date: new Date().toISOString(),
  total: 99.99,
  status: 'processing',
  items: [],
  ...overrides,
});

export const seedTestData = () => {
  console.log('Seeding test data...');
  // Add test data seeding logic here
};
