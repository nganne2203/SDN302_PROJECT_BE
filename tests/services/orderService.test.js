import mongoose from 'mongoose'
import { ORDER_SERVICE } from '#services/orderService.js'
import { orderModel } from '#models/orderModel.js'
import {
  createTestUser,
  createTestProduct,
  createTestBranch,
  createStoreInventory,
  createTestCart,
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

describe('Order Service Tests', () => {
  let testUser
  let testProduct
  let testBranch
  let testCart

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI)
  })

  beforeEach(async () => {
    // Create test data
    testUser = await createTestUser()
    testProduct = await createTestProduct({ price: 100000 }, testUser._id)
    testBranch = await createTestBranch({}, testUser._id)
    await createStoreInventory(testBranch._id, testProduct._id, 100)

    // Create cart with items
    testCart = await createTestCart(testUser._id, [
      {
        product: testProduct._id,
        quantity: 2,
        price: testProduct.price,
        services: []
      }
    ])
  })

  describe('createOrder', () => {
    it('should create order successfully with COD payment', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod',
        message: 'Test order'
      }

      const order = await ORDER_SERVICE.createOrder(testUser._id, orderData)

      expect(order).toBeDefined()
      expect(order.orderNumber).toMatch(/^ORD-/)
      expect(order.user._id.toString()).toBe(testUser._id.toString())
      expect(order.orderStatus).toBe('confirmed')
      expect(order.paymentMethod).toBe('cod')
      expect(order.totalAmount).toBeGreaterThan(0)
      expect(order.items).toHaveLength(1)
    })

    it('should fail when cart is empty', async () => {
      // Clear cart
      await testCart.deleteOne()

      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      await expect(ORDER_SERVICE.createOrder(testUser._id, orderData))
        .rejects.toThrow('Giỏ hàng đang trống')
    })

    it('should fail with non-COD payment method', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'vnpay'
      }

      await expect(ORDER_SERVICE.createOrder(testUser._id, orderData))
        .rejects.toThrow('Hiện tại chỉ hỗ trợ thanh toán COD')
    })

    it('should decrease inventory after creating order', async () => {
      const initialInventory = await mongoose.connection.db
        .collection('storeinventories')
        .findOne({ product: testProduct._id })

      const initialQuantity = initialInventory.quantity

      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      await ORDER_SERVICE.createOrder(testUser._id, orderData)

      const updatedInventory = await mongoose.connection.db
        .collection('storeinventories')
        .findOne({ product: testProduct._id })

      expect(updatedInventory.quantity).toBe(initialQuantity - 2)
    })

    it('should clear cart after order creation', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      await ORDER_SERVICE.createOrder(testUser._id, orderData)

      const cart = await mongoose.connection.db
        .collection('carts')
        .findOne({ user: testUser._id })

      expect(cart).toBeNull()
    })
  })

  describe('getOrderById', () => {
    it('should get order by id for owner', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      const createdOrder = await ORDER_SERVICE.createOrder(testUser._id, orderData)
      const order = await ORDER_SERVICE.getOrderById(
        createdOrder._id,
        testUser._id,
        'customer'
      )

      expect(order).toBeDefined()
      expect(order._id.toString()).toBe(createdOrder._id.toString())
    })

    it('should fail when customer tries to view another user order', async () => {
      const anotherUser = await createTestUser({ email: 'another@example.com' })
      
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      const createdOrder = await ORDER_SERVICE.createOrder(testUser._id, orderData)

      await expect(
        ORDER_SERVICE.getOrderById(createdOrder._id, anotherUser._id, 'customer')
      ).rejects.toThrow('Bạn không có quyền xem đơn hàng này')
    })

    it('should allow admin to view any order', async () => {
      const admin = await createAdminUser()
      
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      const createdOrder = await ORDER_SERVICE.createOrder(testUser._id, orderData)
      const order = await ORDER_SERVICE.getOrderById(
        createdOrder._id,
        admin._id,
        'admin'
      )

      expect(order).toBeDefined()
      expect(order._id.toString()).toBe(createdOrder._id.toString())
    })
  })

  describe('getMyOrders', () => {
    it('should get user orders with pagination', async () => {
      // Create multiple orders
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      await ORDER_SERVICE.createOrder(testUser._id, orderData)
      
      // Create cart again for second order
      await createTestCart(testUser._id, [
        {
          product: testProduct._id,
          quantity: 1,
          price: testProduct.price,
          services: []
        }
      ])
      await ORDER_SERVICE.createOrder(testUser._id, orderData)

      const result = await ORDER_SERVICE.getMyOrders(testUser._id, {
        page: 1,
        limit: 10
      })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.totalItems).toBe(2)
    })

    it('should filter orders by status', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      await ORDER_SERVICE.createOrder(testUser._id, orderData)

      const result = await ORDER_SERVICE.getMyOrders(testUser._id, {
        status: 'confirmed',
        page: 1,
        limit: 10
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].orderStatus).toBe('confirmed')
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      const createdOrder = await ORDER_SERVICE.createOrder(testUser._id, orderData)
      const admin = await createAdminUser()

      const updatedOrder = await ORDER_SERVICE.updateOrderStatus(
        createdOrder._id,
        'shipped',
        admin._id
      )

      expect(updatedOrder.orderStatus).toBe('shipped')
    })

    it('should not update canceled order', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      const createdOrder = await ORDER_SERVICE.createOrder(testUser._id, orderData)
      
      // Cancel order first
      await ORDER_SERVICE.cancelOrder(
        createdOrder._id,
        'Test cancel reason',
        testUser._id,
        'customer'
      )

      const admin = await createAdminUser()

      await expect(
        ORDER_SERVICE.updateOrderStatus(createdOrder._id, 'shipped', admin._id)
      ).rejects.toThrow('Không thể cập nhật đơn hàng đã hủy')
    })
  })

  describe('cancelOrder', () => {
    it('should cancel order and restore inventory', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      const createdOrder = await ORDER_SERVICE.createOrder(testUser._id, orderData)

      const inventoryBeforeCancel = await mongoose.connection.db
        .collection('storeinventories')
        .findOne({ product: testProduct._id })

      const canceledOrder = await ORDER_SERVICE.cancelOrder(
        createdOrder._id,
        'Changed my mind',
        testUser._id,
        'customer'
      )

      expect(canceledOrder.orderStatus).toBe('canceled')
      expect(canceledOrder.cancelReason).toBe('Changed my mind')

      const inventoryAfterCancel = await mongoose.connection.db
        .collection('storeinventories')
        .findOne({ product: testProduct._id })

      expect(inventoryAfterCancel.quantity).toBe(inventoryBeforeCancel.quantity + 2)
    })

    it('should not cancel already canceled order', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      const createdOrder = await ORDER_SERVICE.createOrder(testUser._id, orderData)

      await ORDER_SERVICE.cancelOrder(
        createdOrder._id,
        'First cancel',
        testUser._id,
        'customer'
      )

      await expect(
        ORDER_SERVICE.cancelOrder(
          createdOrder._id,
          'Second cancel',
          testUser._id,
          'customer'
        )
      ).rejects.toThrow('Đơn hàng đã được hủy trước đó')
    })

    it('should not allow customer to cancel shipped order', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      const createdOrder = await ORDER_SERVICE.createOrder(testUser._id, orderData)
      const admin = await createAdminUser()

      // Update to shipped
      await ORDER_SERVICE.updateOrderStatus(createdOrder._id, 'shipped', admin._id)

      await expect(
        ORDER_SERVICE.cancelOrder(
          createdOrder._id,
          'Cancel reason',
          testUser._id,
          'customer'
        )
      ).rejects.toThrow('Không thể hủy đơn hàng đang vận chuyển')
    })
  })

  describe('getOrderStatistics', () => {
    it('should get order statistics for user', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      // Create an order
      const order = await ORDER_SERVICE.createOrder(testUser._id, orderData)

      // Cancel one order
      await ORDER_SERVICE.cancelOrder(
        order._id,
        'Test cancel',
        testUser._id,
        'customer'
      )

      const stats = await ORDER_SERVICE.getOrderStatistics(testUser._id)

      expect(stats.total).toBeGreaterThanOrEqual(1)
      expect(stats.canceled).toBeGreaterThanOrEqual(1)
    })

    it('should get all orders statistics for admin', async () => {
      const orderData = {
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          district: 'District 1',
          ward: 'Ward 1'
        },
        paymentMethod: 'cod'
      }

      await ORDER_SERVICE.createOrder(testUser._id, orderData)

      const stats = await ORDER_SERVICE.getOrderStatistics(null)

      expect(stats.total).toBeGreaterThanOrEqual(1)
      expect(typeof stats.pending).toBe('number')
      expect(typeof stats.confirmed).toBe('number')
      expect(typeof stats.shipped).toBe('number')
      expect(typeof stats.delivered).toBe('number')
      expect(typeof stats.canceled).toBe('number')
    })
  })
})
