import express from 'express'
import cors from 'cors'
import { corsOptions } from '#configs/cors.js'
import { CONNECT_DB, CLOSE_DB } from '#configs/mongodb.js'
import { env } from '#configs/environment.js'
import existHook from 'async-exit-hook'
import { errorHandlingMiddleware } from '#middlewares/errorHandlingMiddleware.js'
import { ROUTES } from '#routes/index.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerHandlingMiddleware } from '#middlewares/swaggerHandlingMiddleware.js'
import { swaggerSpec } from '#configs/swagger.js'
import { initializeDefaultValue } from '#providers/dataInitial.js'

const app = express()

app.use(express.json())

app.use(cors(corsOptions))

// set proxy trust if behind a proxy like Nginx
app.set('trust proxy', 1)

// configs swagger here if needed
if (env.NODE_ENV !== 'prod') {
  app.use('/api-docs', swaggerHandlingMiddleware, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui-standalone-preset.js'
    ]
  }))
}

// Connect to MongoDB when the server starts
app.use(async (req, res, next) => {
  try {
    await CONNECT_DB()
    next()
  } catch (error) { next(error) }
})

// define routes here
app.use(ROUTES)

// error handling middleware here
app.use(errorHandlingMiddleware)

// Start the server
const START_SERVER = () => {
  app.listen(env.PORT, env.HOSTNAME, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running at http://${env.HOSTNAME}:${env.PORT}/`)
  })
  // implement scheduled tasks here if needed

  // Disconnect from MongoDB when the server stops
  existHook(async (callback) => {
    await CLOSE_DB()
    callback()
  })
}

if (env.BUILD_MODE !== 'prod') {
  (async () => {
    try {
      await CONNECT_DB()

      // initialize other services here if needed
      await initializeDefaultValue()
      START_SERVER()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to start server:', error)
      process.exit(1)
    }
  })()
}

export default app