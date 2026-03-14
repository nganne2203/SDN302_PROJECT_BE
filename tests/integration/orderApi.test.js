import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { ORDER_ROUTE } from '#routes/orderRoute.js'
import { CART_ROUTE } from '#routes/cartRoute.js'
import {
  createTestUser,
  createTestProduct,
  createTestBranch,
  createStoreInventory,
  generateToken,
  createAdminUser
} from '../helpers/testHelpers.js'

// Mock email service - Not working with ES Modules, email errors will be caught in service
// jest.mock('#services/emailService.js', () => ({
//   EMAIL_SERVICE: {
//     sendOrderConfirmation: jest.fn().mockResolvedValue(true),
//     sendOrderStatusUpdate: jest.fn().mockResolvedValue(true),
//     sendOrderCancellation: jest.fn().mockResolvedValue(true)
//   }
// }))

const app = express()
app.use(express.json())
app.use('/api/v1/orders', ORDER_ROUTE)
app.use('/api/v1/carts', CART_ROUTE)

describe('Order API Integration Tests', () => {
  let testUser
  let testProduct
  let testBranch
  let userToken
  let adminToken

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI)
  })

  beforeEach(async () => {
    testUser = await createTestUser()
    userToken = generateToken(testUser._id, 'customer')

    const admin = await createAdminUser()
    adminToken = generateToken(admin._id, 'admin')

    testProduct = await createTestProduct({ price: 200000 }, testUser._id)
    testBranch = await createTestBranch({}, testUser._id)
    await createStoreInventory(testBranch._id, testProduct._id, 50)
  })

  describe('POST /api/v1/orders - Create Order', () => {
    beforeEach(async () => {
      // Add product to cart first
      await request(app)
        .post('/api/v1/carts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2,
          services: []
        })
    })

    it('should create order successfully', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod',
          message: 'Please deliver in the morning'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.orderNumber).toMatch(/^ORD-/)
      expect(response.body.data.orderStatus).toBe('confirmed')
      expect(response.body.data.paymentMethod).toBe('cod')
    })

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })

      expect(response.status).toBe(401)
    })

    it('should fail with invalid shipping address', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '123', // Invalid phone
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })

      expect(response.status).toBe(400)
    })

    it('should fail with invalid payment method', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'vnpay'
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('COD')
    })
  })

  describe('GET /api/v1/orders/my-orders - Get My Orders', () => {
    let orderId

    beforeEach(async () => {
      // Add to cart and create order
      await request(app)
        .post('/api/v1/carts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          services: []
        })

      const orderResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })

      orderId = orderResponse.body.data._id
    })

    it('should get my orders successfully', async () => {
      const response = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.pagination).toBeDefined()
    })

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/orders/my-orders?status=confirmed')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.every(order => order.orderStatus === 'confirmed')).toBe(true)
    })

    it('should paginate orders correctly', async () => {
      const response = await request(app)
        .get('/api/v1/orders/my-orders?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.pagination.currentPage).toBe(1)
      expect(response.body.pagination.itemsPerPage).toBe(5)
    })
  })

  describe('GET /api/v1/orders/:orderId - Get Order By ID', () => {
    let orderId

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/carts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          services: []
        })

      const orderResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })

      orderId = orderResponse.body.data._id
    })

    it('should get order by id successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data._id).toBe(orderId)
    })

    it('should fail with invalid order id', async () => {
      const response = await request(app)
        .get('/api/v1/orders/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(500)
    })

    it('should fail when customer views another user order', async () => {
      const anotherUser = await createTestUser({ email: 'another@test.com' })
      const anotherToken = generateToken(anotherUser._id, 'customer')

      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${anotherToken}`)

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/v1/orders/statistics - Get Statistics', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/carts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          services: []
        })

      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })
    })

    it('should get order statistics successfully', async () => {
      const response = await request(app)
        .get('/api/v1/orders/statistics')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.total).toBeGreaterThan(0)
      expect(response.body.data).toHaveProperty('pending')
      expect(response.body.data).toHaveProperty('confirmed')
      expect(response.body.data).toHaveProperty('shipped')
      expect(response.body.data).toHaveProperty('delivered')
      expect(response.body.data).toHaveProperty('canceled')
    })
  })

  describe('PATCH /api/v1/orders/:orderId/cancel - Cancel Order', () => {
    let orderId

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/carts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          services: []
        })

      const orderResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })

      orderId = orderResponse.body.data._id
    })

    it('should cancel order successfully', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cancelReason: 'Changed my mind about this purchase'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.orderStatus).toBe('cancelled')
      expect(response.body.data.cancelReason).toBe('Changed my mind about this purchase')
    })

    it('should fail with short cancel reason', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cancelReason: 'Short'
        })

      expect(response.status).toBe(400)
    })

    it('should fail without cancel reason', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})

      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/v1/orders/:orderId/status - Update Order Status (Admin)', () => {
    let orderId

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/carts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          services: []
        })

      const orderResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })

      orderId = orderResponse.body.data._id
    })

    it('should update order status as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: orderId,
          status: 'shipped'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.orderStatus).toBe('shipped')
    })

    it('should fail as customer', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: orderId,
          status: 'shipped'
        })

      expect(response.status).toBe(403)
    })

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: orderId,
          status: 'invalid-status'
        })

      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/v1/orders/:orderId/delivery - Update Delivery Info (Admin)', () => {
    let orderId

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/carts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          services: []
        })

      const orderResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })

      orderId = orderResponse.body.data._id
    })

    it('should update delivery info as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/delivery`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: orderId,
          providerName: 'Giao Hang Nhanh',
          trackingCode: 'GHN123456789',
          status: 'shipping'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.delivery.providerName).toBe('Giao Hang Nhanh')
      expect(response.body.data.delivery.trackingCode).toBe('GHN123456789')
    })

    it('should fail as customer', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/delivery`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: orderId,
          providerName: 'Giao Hang Nhanh',
          trackingCode: 'GHN123456789'
        })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/v1/orders/all - Get All Orders (Admin)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/carts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          services: []
        })

      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            fullname: 'Test User',
            phone: '0912345678',
            addressLine: '123 Test Street',
            city: 'Ho Chi Minh',
            district: 'District 1',
            ward: 'Ward 1'
          },
          paymentMethod: 'cod'
        })
    })

    it('should get all orders as admin', async () => {
      const response = await request(app)
        .get('/api/v1/orders/all')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should fail as customer', async () => {
      const response = await request(app)
        .get('/api/v1/orders/all')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(403)
    })
  })
})
