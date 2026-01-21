import express from 'express'
import { AUTH_ROUTE } from '#routes/authRoute.js'
import { BRANCH_ROUTE } from '#routes/branchRoute.js'
import { USER_ROUTE } from '#routes/userRoute.js'

const Router = express.Router()

// Sample route
Router.get('/', (req, res) => {
  res.send('Welcome to the Phone Accessories API')
})
Router.use('/api/auth', AUTH_ROUTE)
Router.use('/api/users', USER_ROUTE)
Router.use('/api/branch', BRANCH_ROUTE)
export const ROUTES = Router