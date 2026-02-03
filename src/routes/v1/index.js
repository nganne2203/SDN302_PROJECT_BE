import express from 'express'
import { AUTH_ROUTE } from '#routes/v1/authRoute.js'
import { BRANCH_ROUTE } from '#routes/v1/branchRoute.js'
import { USER_ROUTE } from '#routes/v1/userRoute.js'
import { CATEGORY_ROUTE } from '#routes/v1/categoryRoute.js'
import { DEVICE_ROUTE } from '#routes/v1/deviceRoute.js'
import { PRODUCT_ROUTE } from '#routes/v1/productRoute.js'
import { UPLOAD_ROUTE } from '#routes/v1/uploadRoute.js'
import INVENTORY_ROUTE from '#routes/v1/inventoryRoute.js'
import STORE_INVENTORY_ROUTE from '#routes/v1/storeInventoryRoute.js'
import STOCK_REQUEST_ROUTE from '#routes/v1/stockRequestRoute.js'
import { SERVICE_ROUTE } from '#routes/v1/serviceRoute.js'
import { CART_ROUTE } from '#routes/v1/cartRoute.js'
import { ORDER_ROUTE } from '#routes/v1/orderRoute.js'
import { PAYMENT_ROUTE } from '#routes/v1/paymentRoute.js'
import { STATISTICS_ROUTE } from '#routes/v1/statisticsRoute.js'
import { pricingRoute } from '#routes/v1/pricingRoute.js'
import { REVIEW_ROUTE } from '#routes/v1/reviewRoute.js'

const Router = express.Router()

// Sample route
Router.get('/', (req, res) => {
  res.send('Welcome to the Phone Accessories API')
})
Router.use('/api/v1/auth', AUTH_ROUTE)
Router.use('/api/v1/users', USER_ROUTE)
Router.use('/api/v1/branches', BRANCH_ROUTE)
Router.use('/api/v1/categories', CATEGORY_ROUTE)
Router.use('/api/v1/devices', DEVICE_ROUTE)
Router.use('/api/v1/products', PRODUCT_ROUTE)
Router.use('/api/v1/uploads', UPLOAD_ROUTE)
Router.use('/api/v1/inventories', INVENTORY_ROUTE)
Router.use('/api/v1/store-inventories', STORE_INVENTORY_ROUTE)
Router.use('/api/v1/stock-requests', STOCK_REQUEST_ROUTE)
Router.use('/api/v1/services', SERVICE_ROUTE)
Router.use('/api/v1/carts', CART_ROUTE)
Router.use('/api/v1/orders', ORDER_ROUTE)
Router.use('/api/v1/payments', PAYMENT_ROUTE)
Router.use('/api/v1/statistics', STATISTICS_ROUTE)
Router.use('/api/v1/pricings', pricingRoute)
Router.use('/api/v1/reviews', REVIEW_ROUTE)

export const ROUTES = Router