import express from 'express'
import { AUTH_ROUTE } from '#routes/authRoute.js'

const Router = express.Router()

// Sample route
Router.get('/', (req, res) => {
  res.send('Welcome to the Phone Accessories API')
})
Router.use('/api/auth', AUTH_ROUTE)

export const ROUTES = Router