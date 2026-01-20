import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Phone Accessories API',
      version: '1.0.0',
      description: 'API documentation for Phone Accessories application'
    },
    servers: [],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'Bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
}

export const swaggerSpec = swaggerJSDoc(options)