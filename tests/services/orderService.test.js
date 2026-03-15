import mongoose from 'mongoose'
import { ORDER_SERVICE } from '#services/orderService.js'
import { orderModel } from '#models/orderModel.js'
import { paymentModel } from '#models/paymentModel.js'
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

      const payment = await paymentModel.findOne({ order: order._id }).lean()
      expect(payment).toBeDefined()
      expect(payment.method).toBe('cod')
      expect(payment.provider).toBe('cod')
      expect(payment.status).toBe('pending')
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

    it('should mark COD payment as success when order is delivered', async () => {
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

      await ORDER_SERVICE.updateOrderStatus(createdOrder._id, 'delivered', admin._id)

      const payment = await paymentModel.findOne({ order: createdOrder._id }).lean()
      expect(payment).toBeDefined()
      expect(payment.status).toBe('success')
      expect(payment.paidAt).toBeTruthy()
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
        { id: testUser._id, role: 'customer' },
        'Test cancel reason'
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
        { id: testUser._id, role: 'customer' },
        'Changed my mind'
      )

      expect(canceledOrder.orderStatus).toBe('cancelled')
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
        { id: testUser._id, role: 'customer' },
        'First cancel'
      )

      await expect(
        ORDER_SERVICE.cancelOrder(
          createdOrder._id,
          { id: testUser._id, role: 'customer' },
          'Second cancel'
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
          { id: testUser._id, role: 'customer' },
          'Cancel reason'
        )
      ).rejects.toThrow('Không thể hủy đơn hàng đang vận chuyển')
    })

    it('should cancel VNPay SUCCESS => paymentStatus REFUNDED and send email', async () => {
      const user = { id: testUser._id, role: 'customer' }

      const orderNumber = `ORD-VNPAY-${Date.now()}`

      // Simulate reserved inventory: quantity already decreased by 2
      await mongoose.connection.db.collection('storeinventories').updateOne(
        { branch: testBranch._id, product: testProduct._id },
        { $set: { quantity: 48 } }
      )

      const order = await orderModel.create({
        orderNumber,
        type: 'online',
        user: testUser._id,
        items: [{ product: testProduct._id, quantity: 2, price: testProduct.price, services: [] }],
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          ward: 'Ward 1'
        },
        orderStatus: 'confirmed',
        subtotal: testProduct.price * 2,
        shippingFee: 0,
        totalAmount: testProduct.price * 2,
        pricingApplied: [],
        paymentMethod: 'vnpay',
        delivery: { status: 'pending' },
        message: '',
        branch: testBranch._id,
        createdBy: testUser._id
      })

      await paymentModel.create({
        order: order._id,
        user: testUser._id,
        method: 'vnpay',
        provider: 'vnpay',
        amount: order.totalAmount,
        currency: 'VND',
        status: 'success',
        transactionId: `TXN-VNPAY-${Date.now()}`,
        paidAt: new Date()
      })

      // Pseudo-mock email sender (ESM safe via mutating exported object)
      const { EMAIL_SERVICE } = await import('#services/emailService.js')
      const originalEmailFn = EMAIL_SERVICE.sendVNPayCancelRefundEmail
      let emailSent = false
      EMAIL_SERVICE.sendVNPayCancelRefundEmail = async () => {
        emailSent = true
        return true
      }

      const canceledOrder = await ORDER_SERVICE.cancelOrder(order._id, user, 'Customer cancel VNPay')

      const updatedPayment = await paymentModel.findOne({ order: order._id }).lean()
      expect(canceledOrder.orderStatus).toBe('cancelled')
      expect(updatedPayment.status).toBe('refunded')
      expect(emailSent).toBe(true)

      const inventoryAfterCancel = await mongoose.connection.db
        .collection('storeinventories')
        .findOne({ branch: testBranch._id, product: testProduct._id })
      expect(inventoryAfterCancel.quantity).toBe(50)

      EMAIL_SERVICE.sendVNPayCancelRefundEmail = originalEmailFn
    })

    it('should reject VNPay cancel when paymentStatus is not SUCCESS', async () => {
      const user = { id: testUser._id, role: 'customer' }

      const order = await orderModel.create({
        orderNumber: `ORD-VNPAY-PENDING-${Date.now()}`,
        type: 'online',
        user: testUser._id,
        items: [{ product: testProduct._id, quantity: 1, price: testProduct.price, services: [] }],
        shippingAddress: {
          fullname: 'Test User',
          phone: '0912345678',
          addressLine: '123 Test St',
          city: 'HCM',
          ward: 'Ward 1'
        },
        orderStatus: 'confirmed',
        subtotal: testProduct.price,
        shippingFee: 0,
        totalAmount: testProduct.price,
        pricingApplied: [],
        paymentMethod: 'vnpay',
        delivery: { status: 'pending' },
        message: '',
        branch: testBranch._id,
        createdBy: testUser._id
      })

      await paymentModel.create({
        order: order._id,
        user: testUser._id,
        method: 'vnpay',
        provider: 'vnpay',
        amount: order.totalAmount,
        currency: 'VND',
        status: 'pending',
        transactionId: `TXN-VNPAY-PENDING-${Date.now()}`
      })

      await expect(
        ORDER_SERVICE.cancelOrder(order._id, user, 'Try cancel when not paid')
      ).rejects.toThrow('Chỉ cho phép hủy đơn VNPay khi đã thanh toán thành công')
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
        { id: testUser._id, role: 'customer' },
        'Test cancel'
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
