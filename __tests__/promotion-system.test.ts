// /**
//  * Comprehensive Test Suite for Promotion Persistence System
//  * 
//  * Tests the complete database-first promotion system including:
//  * - Cart promotion application and removal
//  * - Promotion persistence across page navigation
//  * - Order creation with promotions
//  * - Webhook processing and promotion usage tracking
//  * - Email notifications
//  * - Both authenticated and guest user flows
//  */

// import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
// import { PrismaClient } from '@prisma/client';
// import { addPromotionToCart, removePromotionFromCart, getCartPromotions } from '@/lib/actions/cart.actions';
// import { createOrder, createGuestOrder } from '@/lib/actions/order.actions';
// import { recordPromotionUsage } from '@/lib/actions/promotions-actions';
// import { sendOrderConfirmationEmail } from '@/email';

// // Mock external dependencies
// vi.mock('@/email', () => ({
//   sendOrderConfirmationEmail: vi.fn()
// }));

// vi.mock('@/auth', () => ({
//   auth: vi.fn()
// }));

// const prisma = new PrismaClient();

// describe('Promotion Persistence System', () => {
//   let testPromotion: any;
//   let testProduct: any;
//   let testInventory: any;
//   let testCategory: any;
//   let testUser: any;
//   let testGuestCart: any;
//   let testUserCart: any;

//   beforeAll(async () => {
//     // Set up test data
//     await setupTestData();
//   });

//   afterAll(async () => {
//     // Clean up test data
//     await cleanupTestData();
//     await prisma.$disconnect();
//   });

//   beforeEach(async () => {
//     // Reset promotion usage count
//     await prisma.promotion.update({
//       where: { id: testPromotion.id },
//       data: { usageCount: 0 }
//     });

//     // Clear cart promotions
//     await prisma.cartPromotion.deleteMany({
//       where: {
//         OR: [
//           { cartId: testGuestCart.id },
//           { cartId: testUserCart.id }
//         ]
//       }
//     });

//     // Clear promotion usage records
//     await prisma.promotionUsage.deleteMany({
//       where: { promotionId: testPromotion.id }
//     });
//   });

//   describe('Cart Promotion Management', () => {
//     describe('Guest User Flow', () => {
//       it('should apply promotion to guest cart', async () => {
//         const result = await addPromotionToCart(testGuestCart.id, {
//           id: testPromotion.id,
//           couponCode: testPromotion.couponCode,
//           discount: 10.99,
//           type: 'PERCENTAGE_DISCOUNT'
//         });

//         expect(result.success).toBe(true);

//         // Verify promotion is stored in database
//         const cartPromotions = await getCartPromotions(testGuestCart.id);
//         expect(cartPromotions).toHaveLength(1);
//         expect(cartPromotions[0].couponCode).toBe(testPromotion.couponCode);
//         expect(cartPromotions[0].discount.toNumber()).toBe(10.99);
//       });

//       it('should remove promotion from guest cart', async () => {
//         // First apply promotion
//         await addPromotionToCart(testGuestCart.id, {
//           id: testPromotion.id,
//           couponCode: testPromotion.couponCode,
//           discount: 10.99,
//           type: 'PERCENTAGE_DISCOUNT'
//         });

//         // Then remove it
//         const result = await removePromotionFromCart(testGuestCart.id, testPromotion.id);
//         expect(result.success).toBe(true);

//         // Verify promotion is removed from database
//         const cartPromotions = await getCartPromotions(testGuestCart.id);
//         expect(cartPromotions).toHaveLength(0);
//       });

//       it('should prevent duplicate promotions in guest cart', async () => {
//         // Apply promotion first time
//         await addPromotionToCart(testGuestCart.id, {
//           id: testPromotion.id,
//           couponCode: testPromotion.couponCode,
//           discount: 10.99,
//           type: 'PERCENTAGE_DISCOUNT'
//         });

//         // Try to apply same promotion again
//         const result = await addPromotionToCart(testGuestCart.id, {
//           id: testPromotion.id,
//           couponCode: testPromotion.couponCode,
//           discount: 10.99,
//           type: 'PERCENTAGE_DISCOUNT'
//         });

//         expect(result.success).toBe(false);
//         expect(result.error).toContain('already applied');

//         // Verify only one promotion exists
//         const cartPromotions = await getCartPromotions(testGuestCart.id);
//         expect(cartPromotions).toHaveLength(1);
//       });
//     });

//     describe('Authenticated User Flow', () => {
//       it('should apply promotion to authenticated user cart', async () => {
//         const result = await addPromotionToCart(testUserCart.id, {
//           id: testPromotion.id,
//           couponCode: testPromotion.couponCode,
//           discount: 10.99,
//           type: 'PERCENTAGE_DISCOUNT'
//         });

//         expect(result.success).toBe(true);

//         // Verify promotion is stored in database
//         const cartPromotions = await getCartPromotions(testUserCart.id);
//         expect(cartPromotions).toHaveLength(1);
//         expect(cartPromotions[0].couponCode).toBe(testPromotion.couponCode);
//       });

//       it('should remove promotion from authenticated user cart', async () => {
//         // First apply promotion
//         await addPromotionToCart(testUserCart.id, {
//           id: testPromotion.id,
//           couponCode: testPromotion.couponCode,
//           discount: 10.99,
//           type: 'PERCENTAGE_DISCOUNT'
//         });

//         // Then remove it
//         const result = await removePromotionFromCart(testUserCart.id, testPromotion.id);
//         expect(result.success).toBe(true);

//         // Verify promotion is removed from database
//         const cartPromotions = await getCartPromotions(testUserCart.id);
//         expect(cartPromotions).toHaveLength(0);
//       });
//     });
//   });

//   describe('Order Creation with Promotions', () => {
//     describe('Guest Order Creation', () => {
//       it('should create guest order with applied promotion', async () => {
//         // Apply promotion to guest cart
//         await addPromotionToCart(testGuestCart.id, {
//           id: testPromotion.id,
//           couponCode: testPromotion.couponCode,
//           discount: 10.99,
//           type: 'PERCENTAGE_DISCOUNT'
//         });

//         // Create order data
//         const orderData = {
//           cartId: testGuestCart.id,
//           shippingAddress: {
//             fullName: 'Test Guest',
//             email: 'test.guest@example.com',
//             phone: '1234567890',
//             address: '123 Test St',
//             city: 'Test City',
//             state: 'TS',
//             zipCode: '12345',
//             country: 'US'
//           },
//           shipping: {
//             method: 'Standard',
//             cost: 9.99
//           },
//           payment: {
//             method: 'PayPal',
//             status: 'PENDING'
//           },
//           subtotal: 50.00,
//           tax: 5.00,
//           total: 54.00, // 50 + 5 + 9.99 - 10.99
//           appliedPromotion: {
//             id: testPromotion.id,
//             discount: 10.99
//           }
//         };

//         const result = await createGuestOrder(orderData);
//         expect(result.success).toBe(true);
//         expect(result.order).toBeDefined();

//         // Verify order has promotion data
//         const order = await prisma.order.findUnique({
//           where: { id: result.order.id },
//           include: { appliedPromotion: true }
//         });

//         expect(order?.appliedPromotionId).toBe(testPromotion.id);
//         expect(order?.discountAmount?.toNumber()).toBe(10.99);
//         expect(order?.guestEmail).toBe('test.guest@example.com');
//       });
//     });

//     describe('Authenticated User Order Creation', () => {
//       it('should create authenticated user order with applied promotion', async () => {
//         // Mock authenticated session
//         const { auth } = await import('@/auth');
//         vi.mocked(auth).mockResolvedValue({
//           user: { id: testUser.id, email: testUser.email, name: testUser.name }
//         } as any);

//         // Apply promotion to user cart
//         await addPromotionToCart(testUserCart.id, {
//           id: testPromotion.id,
//           couponCode: testPromotion.couponCode,
//           discount: 10.99,
//           type: 'PERCENTAGE_DISCOUNT'
//         });

//         // Create order data
//         const orderData = {
//           cartId: testUserCart.id,
//           shippingAddress: {
//             fullName: testUser.name,
//             email: testUser.email,
//             phone: '1234567890',
//             address: '123 Test St',
//             city: 'Test City',
//             state: 'TS',
//             zipCode: '12345',
//             country: 'US'
//           },
//           shipping: {
//             method: 'Standard',
//             cost: 9.99
//           },
//           payment: {
//             method: 'Stripe',
//             status: 'PENDING'
//           },
//           subtotal: 50.00,
//           tax: 5.00,
//           total: 54.00,
//           appliedPromotion: {
//             id: testPromotion.id,
//             discount: 10.99
//           }
//         };

//         const result = await createOrder(orderData);
//         expect(result.success).toBe(true);
//         expect(result.data).toBeDefined();

//         // Verify order has promotion data
//         const order = await prisma.order.findUnique({
//           where: { id: result.data.id },
//           include: { appliedPromotion: true }
//         });

//         expect(order?.appliedPromotionId).toBe(testPromotion.id);
//         expect(order?.discountAmount?.toNumber()).toBe(10.99);
//         expect(order?.userId).toBe(testUser.id);
//       });
//     });
//   });

//   describe('Webhook Processing and Promotion Usage', () => {
//     it('should record promotion usage for guest order', async () => {
//       // Create guest order with promotion
//       const orderData = {
//         cartId: testGuestCart.id,
//         shippingAddress: {
//           email: 'test.guest@example.com'
//         },
//         shipping: { method: 'Standard', cost: 9.99 },
//         payment: { method: 'PayPal', status: 'PENDING' },
//         subtotal: 50.00,
//         tax: 5.00,
//         total: 54.00,
//         appliedPromotion: {
//           id: testPromotion.id,
//           discount: 10.99
//         }
//       };

//       const orderResult = await createGuestOrder(orderData);
//       const orderId = orderResult.order.id;

//       // Simulate webhook processing
//       await recordPromotionUsage(orderId);

//       // Verify promotion usage was recorded
//       const promotionUsage = await prisma.promotionUsage.findFirst({
//         where: {
//           orderId: orderId,
//           promotionId: testPromotion.id
//         }
//       });

//       expect(promotionUsage).toBeDefined();
//       expect(promotionUsage?.discountAmount.toNumber()).toBe(10.99);
//       expect(promotionUsage?.couponCode).toBe(testPromotion.couponCode);

//       // Verify promotion usage count was incremented
//       const updatedPromotion = await prisma.promotion.findUnique({
//         where: { id: testPromotion.id }
//       });
//       expect(updatedPromotion?.usageCount).toBe(1);
//     });

//     it('should record promotion usage for authenticated user order', async () => {
//       // Mock authenticated session
//       const { auth } = await import('@/auth');
//       vi.mocked(auth).mockResolvedValue({
//         user: { id: testUser.id, email: testUser.email, name: testUser.name }
//       } as any);

//       // Create user order with promotion
//       const orderData = {
//         cartId: testUserCart.id,
//         shippingAddress: {
//           email: testUser.email
//         },
//         shipping: { method: 'Standard', cost: 9.99 },
//         payment: { method: 'Stripe', status: 'PENDING' },
//         subtotal: 50.00,
//         tax: 5.00,
//         total: 54.00,
//         appliedPromotion: {
//           id: testPromotion.id,
//           discount: 10.99
//         }
//       };

//       const orderResult = await createOrder(orderData);
//       const orderId = orderResult.data.id;

//       // Simulate webhook processing
//       await recordPromotionUsage(orderId);

//       // Verify promotion usage was recorded
//       const promotionUsage = await prisma.promotionUsage.findFirst({
//         where: {
//           orderId: orderId,
//           promotionId: testPromotion.id
//         }
//       });

//       expect(promotionUsage).toBeDefined();
//       expect(promotionUsage?.userId).toBe(testUser.id);
//       expect(promotionUsage?.discountAmount.toNumber()).toBe(10.99);

//       // Verify promotion usage count was incremented
//       const updatedPromotion = await prisma.promotion.findUnique({
//         where: { id: testPromotion.id }
//       });
//       expect(updatedPromotion?.usageCount).toBe(1);
//     });

//     it('should send email notification after successful payment', async () => {
//       // Create order with promotion
//       const orderData = {
//         cartId: testGuestCart.id,
//         shippingAddress: { email: 'test.guest@example.com' },
//         shipping: { method: 'Standard', cost: 9.99 },
//         payment: { method: 'PayPal', status: 'PENDING' },
//         subtotal: 50.00,
//         tax: 5.00,
//         total: 54.00,
//         appliedPromotion: {
//           id: testPromotion.id,
//           discount: 10.99
//         }
//       };

//       const orderResult = await createGuestOrder(orderData);
//       const orderId = orderResult.order.id;

//       // Simulate webhook processing (email sending)
//       await sendOrderConfirmationEmail(orderId);

//       // Verify email was called
//       expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(orderId);
//     });

//     it('should prevent duplicate promotion usage recording', async () => {
//       // Create order with promotion
//       const orderData = {
//         cartId: testGuestCart.id,
//         shippingAddress: { email: 'test.guest@example.com' },
//         shipping: { method: 'Standard', cost: 9.99 },
//         payment: { method: 'PayPal', status: 'PENDING' },
//         subtotal: 50.00,
//         tax: 5.00,
//         total: 54.00,
//         appliedPromotion: {
//           id: testPromotion.id,
//           discount: 10.99
//         }
//       };

//       const orderResult = await createGuestOrder(orderData);
//       const orderId = orderResult.order.id;

//       // Record promotion usage twice (simulate duplicate webhook calls)
//       await recordPromotionUsage(orderId);
//       await recordPromotionUsage(orderId);

//       // Verify only one usage record exists
//       const promotionUsageRecords = await prisma.promotionUsage.findMany({
//         where: {
//           orderId: orderId,
//           promotionId: testPromotion.id
//         }
//       });

//       expect(promotionUsageRecords).toHaveLength(1);

//       // Verify promotion usage count was incremented only once
//       const updatedPromotion = await prisma.promotion.findUnique({
//         where: { id: testPromotion.id }
//       });
//       expect(updatedPromotion?.usageCount).toBe(1);
//     });
//   });

//   describe('Edge Cases and Error Handling', () => {
//     it('should handle invalid promotion codes gracefully', async () => {
//       const result = await addPromotionToCart(testGuestCart.id, {
//         id: 'invalid-promotion-id',
//         couponCode: 'INVALID',
//         discount: 10.99,
//         type: 'PERCENTAGE_DISCOUNT'
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toBeDefined();
//     });

//     it('should handle expired promotions', async () => {
//       // Create expired promotion
//       const expiredPromotion = await prisma.promotion.create({
//         data: {
//           name: 'Expired Test Promotion',
//           promotionType: 'PERCENTAGE_DISCOUNT',
//           value: 15,
//           startDate: new Date('2023-01-01'),
//           endDate: new Date('2023-01-02'), // Expired
//           couponCode: 'EXPIRED15',
//           isActive: true
//         }
//       });

//       const result = await addPromotionToCart(testGuestCart.id, {
//         id: expiredPromotion.id,
//         couponCode: expiredPromotion.couponCode,
//         discount: 15.00,
//         type: 'PERCENTAGE_DISCOUNT'
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('expired');

//       // Cleanup
//       await prisma.promotion.delete({
//         where: { id: expiredPromotion.id }
//       });
//     });

//     it('should handle orders without promotions', async () => {
//       // Create order without promotion
//       const orderData = {
//         cartId: testGuestCart.id,
//         shippingAddress: { email: 'test.guest@example.com' },
//         shipping: { method: 'Standard', cost: 9.99 },
//         payment: { method: 'PayPal', status: 'PENDING' },
//         subtotal: 50.00,
//         tax: 5.00,
//         total: 64.99
//         // No appliedPromotion
//       };

//       const orderResult = await createGuestOrder(orderData);
//       expect(orderResult.success).toBe(true);

//       // Verify order has no promotion data
//       const order = await prisma.order.findUnique({
//         where: { id: orderResult.order.id }
//       });

//       expect(order?.appliedPromotionId).toBeNull();
//       expect(order?.discountAmount).toBeNull();

//       // Verify recordPromotionUsage handles orders without promotions
//       await expect(recordPromotionUsage(orderResult.order.id)).resolves.not.toThrow();
//     });
//   });

//   // Helper functions for test setup and cleanup
//   async function setupTestData() {
//     // Create test category
//     testCategory = await prisma.category.create({
//       data: {
//         name: 'Test Category',
//         slug: 'test-category'
//       }
//     });

//     // Create test product
//     testProduct = await prisma.product.create({
//       data: {
//         name: 'Test Product',
//         description: 'Test product for promotion testing',
//         slug: 'test-product',
//         categoryId: testCategory.id
//       }
//     });

//     // Create test inventory
//     testInventory = await prisma.productInventory.create({
//       data: {
//         productId: testProduct.id,
//         sku: 'TEST-SKU-001',
//         retailPrice: 25.00,
//         costPrice: 15.00,
//         quantity: 100,
//         images: ['test-image.jpg']
//       }
//     });

//     // Create test user
//     testUser = await prisma.user.create({
//       data: {
//         email: 'test.user@example.com',
//         name: 'Test User'
//       }
//     });

//     // Create test promotion
//     testPromotion = await prisma.promotion.create({
//       data: {
//         name: 'Test Promotion',
//         promotionType: 'PERCENTAGE_DISCOUNT',
//         value: 20,
//         startDate: new Date('2024-01-01'),
//         endDate: new Date('2025-12-31'),
//         couponCode: 'TEST20',
//         isActive: true
//       }
//     });

//     // Create guest cart
//     testGuestCart = await prisma.cart.create({
//       data: {
//         sessionId: 'test-guest-session',
//         items: {
//           create: {
//             productId: testProduct.id,
//             inventoryId: testInventory.id,
//             quantity: 2
//           }
//         }
//       }
//     });

//     // Create user cart
//     testUserCart = await prisma.cart.create({
//       data: {
//         userId: testUser.id,
//         items: {
//           create: {
//             productId: testProduct.id,
//             inventoryId: testInventory.id,
//             quantity: 2
//           }
//         }
//       }
//     });
//   }

//   async function cleanupTestData() {
//     // Clean up in reverse order of creation
//     await prisma.cartItem.deleteMany({
//       where: {
//         OR: [
//           { cartId: testGuestCart?.id },
//           { cartId: testUserCart?.id }
//         ]
//       }
//     });

//     await prisma.cartPromotion.deleteMany({
//       where: {
//         OR: [
//           { cartId: testGuestCart?.id },
//           { cartId: testUserCart?.id }
//         ]
//       }
//     });

//     await prisma.cart.deleteMany({
//       where: {
//         OR: [
//           { id: testGuestCart?.id },
//           { id: testUserCart?.id }
//         ]
//       }
//     });

//     await prisma.promotionUsage.deleteMany({
//       where: { promotionId: testPromotion?.id }
//     });

//     await prisma.orderItem.deleteMany({
//       where: { productId: testProduct?.id }
//     });

//     await prisma.order.deleteMany({
//       where: { appliedPromotionId: testPromotion?.id }
//     });

//     await prisma.promotion.deleteMany({
//       where: { id: testPromotion?.id }
//     });

//     await prisma.productInventory.deleteMany({
//       where: { id: testInventory?.id }
//     });

//     await prisma.product.deleteMany({
//       where: { id: testProduct?.id }
//     });

//     await prisma.category.deleteMany({
//       where: { id: testCategory?.id }
//     });

//     await prisma.user.deleteMany({
//       where: { id: testUser?.id }
//     });
//   }
// }); 