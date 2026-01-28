import express from 'express'
import { AUTH_ROUTE } from '#routes/authRoute.js'
import { BRANCH_ROUTE } from '#routes/branchRoute.js'
import { USER_ROUTE } from '#routes/userRoute.js'
import { CATEGORY_ROUTE } from '#routes/categoryRoute.js'
import { DEVICE_ROUTE } from '#routes/deviceRoute.js'
import { UPLOAD_ROUTE } from '#routes/uploadRoute.js'
import INVENTORY_ROUTE from '#routes/inventoryRoute.js'
import STORE_INVENTORY_ROUTE from '#routes/storeInventoryRoute.js'
import STOCK_REQUEST_ROUTE from '#routes/stockRequestRoute.js'

const Router = express.Router()

// Sample route
Router.get('/', (req, res) => {
  res.send('Welcome to the Phone Accessories API')
})
Router.use('/api/auth', AUTH_ROUTE)
Router.use('/api/users', USER_ROUTE)
Router.use('/api/branch', BRANCH_ROUTE)
Router.use('/api/category', CATEGORY_ROUTE)
Router.use('/api/devices', DEVICE_ROUTE)
Router.use('/api/uploads', UPLOAD_ROUTE)
Router.use('/api/inventory', INVENTORY_ROUTE)
Router.use('/api/store-inventory', STORE_INVENTORY_ROUTE)
Router.use('/api/stock-request', STOCK_REQUEST_ROUTE)

export const ROUTES = Router