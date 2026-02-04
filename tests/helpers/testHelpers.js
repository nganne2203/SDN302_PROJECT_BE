import jwt from 'jsonwebtoken'
import { userModel } from '#models/userModel.js'
import { productModel } from '#models/productModel.js'
import { branchModel } from '#models/branchModel.js'
import { storeInventoryModel } from '#models/storeInventoryModel.js'
import { cartModel } from '#models/cartModel.js'
import { categoryModel } from '#models/categoryModel.js'
import { deviceModel } from '#models/deviceModel.js'

/**
 * Generate JWT token for testing
 */
export const generateToken = (userId, role = 'customer') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
}

/**
 * Create a test user
 */
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    fullname: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuv', // hashed password
    phone: '0912345678',
    role: 'customer',
    isActive: true,
    isEmailVerified: true
  }

  const user = await userModel.create({ ...defaultUser, ...userData })
  return user
}

/**
 * Create admin user
 */
export const createAdminUser = async () => {
  return await createTestUser({
    email: 'admin@example.com',
    fullname: 'Admin User',
    role: 'admin'
  })
}

/**
 * Create staff user
 */
export const createStaffUser = async () => {
  return await createTestUser({
    email: 'staff@example.com',
    fullname: 'Staff User',
    role: 'staff'
  })
}

/**
 * Create a test category
 */
export const createTestCategory = async (categoryData = {}, userId) => {
  const defaultCategory = {
    name: 'Test Category',
    description: 'Test category description',
    slug: 'test-category',
    isActive: true,
    createdBy: userId
  }

  return await categoryModel.create({ ...defaultCategory, ...categoryData })
}

/**
 * Create a test device
 */
export const createTestDevice = async (deviceData = {}, userId) => {
  const defaultDevice = {
    name: 'iPhone 15',
    type: 'smartphone',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    isActive: true,
    createdBy: userId
  }

  return await deviceModel.create({ ...defaultDevice, ...deviceData })
}

/**
 * Create a test product
 */
export const createTestProduct = async (productData = {}, userId) => {
  const category = await createTestCategory({}, userId)
  const device = await createTestDevice({}, userId)

  const defaultProduct = {
    name: 'Test Product',
    description: 'Test product description',
    price: 100000,
    images: ['https://example.com/image.jpg'],
    slug: 'test-product',
    category: category._id,
    device: device._id,
    isActive: true,
    createdBy: userId
  }

  return await productModel.create({ ...defaultProduct, ...productData })
}

/**
 * Create a test branch
 */
export const createTestBranch = async (branchData = {}, userId) => {
  const defaultBranch = {
    name: 'Test Branch',
    address: '123 Test Street',
    phone: '0912345678',
    email: 'branch@test.com',
    isActive: true,
    createdBy: userId
  }

  return await branchModel.create({ ...defaultBranch, ...branchData })
}

/**
 * Create store inventory
 */
export const createStoreInventory = async (branchId, productId, quantity = 100) => {
  return await storeInventoryModel.create({
    branch: branchId,
    product: productId,
    quantity
  })
}

/**
 * Create a test cart with items
 */
export const createTestCart = async (userId, items = []) => {
  const defaultItems = items.length > 0 ? items : []
  
  const totalPrice = defaultItems.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)

  return await cartModel.create({
    user: userId,
    items: defaultItems,
    totalPrice
  })
}

/**
 * Mock email service to prevent actual email sending
 */
export const mockEmailService = () => {
  jest.mock('#services/emailService.js', () => ({
    EMAIL_SERVICE: {
      sendOrderConfirmation: jest.fn().mockResolvedValue(true),
      sendOrderStatusUpdate: jest.fn().mockResolvedValue(true),
      sendOrderCancellation: jest.fn().mockResolvedValue(true)
    }
  }))
}
