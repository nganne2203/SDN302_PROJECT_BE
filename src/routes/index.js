import express from 'express'
import { AUTH_ROUTE } from '#routes/authRoute.js'
import { BRANCH_ROUTE } from '#routes/branchRoute.js'
import { USER_ROUTE } from '#routes/userRoute.js'
import { CATEGORY_ROUTE } from '#routes/categoryRoute.js'
import { DEVICE_ROUTE } from '#routes/deviceRoute.js'
import { PRODUCT_ROUTE } from '#routes/productRoute.js'
import { UPLOAD_ROUTE } from '#routes/uploadRoute.js'
import INVENTORY_ROUTE from '#routes/inventoryRoute.js'
import STORE_INVENTORY_ROUTE from '#routes/storeInventoryRoute.js'
import STOCK_REQUEST_ROUTE from '#routes/stockRequestRoute.js'
import { CART_ROUTE } from '#routes/cartRoute.js'

const Router = express.Router()

// Sample route
Router.get('/', (req, res) => {
  res.send('Welcome to the Phone Accessories API')
})
Router.use('/api/auth', AUTH_ROUTE)
Router.use('/api/users', USER_ROUTE)
Router.use('/api/branches', BRANCH_ROUTE)
Router.use('/api/categories', CATEGORY_ROUTE)
Router.use('/api/devices', DEVICE_ROUTE)
Router.use('/api/products', PRODUCT_ROUTE)
Router.use('/api/uploads', UPLOAD_ROUTE)
Router.use('/api/inventories', INVENTORY_ROUTE)
Router.use('/api/store-inventories', STORE_INVENTORY_ROUTE)
Router.use('/api/stock-requests', STOCK_REQUEST_ROUTE)
Router.use('/api/carts', CART_ROUTE)
export const ROUTES = Router