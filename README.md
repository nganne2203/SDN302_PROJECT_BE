# Phone Accessories API

A Node.js backend API for managing phone accessories. Built with Express.js, MongoDB, and modern JavaScript practices.

## Features

- **Express.js Server** - Fast and lightweight web framework
- **MongoDB Integration** - NoSQL database with Mongoose ODM
- **Authentication & Authorization** - JWT-based authentication with bcrypt password hashing
- **Email Service** - Nodemailer integration for email notifications
- **API Documentation** - Swagger/OpenAPI documentation
- **Error Handling** - Centralized error handling middleware
- **CORS Support** - Cross-origin resource sharing configuration
- **Input Validation** - Request validation using Joi
- **Pagination** - Built-in pagination support with mongoose-paginate-v2
- **Environment Configuration** - Environment-based configuration management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Database**: MongoDB with Mongoose v8.0.0
- **Authentication**: JWT (jsonwebtoken) & bcrypt
- **Email**: Nodemailer v6.9.9
- **Validation**: Joi v17.13.3
- **API Docs**: Swagger UI Express v5.0.1
- **Development**: Nodemon, Cross-env

## Project Structure

```
src/
├── server.js                 # Main application entry point
├── configs/                  # Configuration files
│   ├── cors.js              # CORS settings
│   ├── environment.js       # Environment variables
│   ├── mail.js              # Email configuration
│   ├── mongodb.js           # MongoDB connection
│   └── swagger.js           # Swagger/OpenAPI config
├── constants/               # Application constants
│   ├── errorCode.js         # Error codes
│   ├── userConstant.js      # User-related constants
│   └── verificationConstant.js  # Verification constants
├── controllers/             # Route controllers (business logic)
├── middlewares/             # Express middlewares
│   ├── errorHandlingMiddlware.js
│   ├── swaggerHandlingMiddleware.js
│   └── validationHandlingMiddleware.js
├── models/                  # Mongoose schemas
│   ├── userModel.js
│   └── verificationModel.js
├── providers/               # External service providers
├── repositories/            # Data access layer
├── routes/                  # API route definitions
├── services/                # Business logic services
├── sockets/                 # WebSocket handlers (if applicable)
├── utils/                   # Utility functions
│   ├── ApiError.js          # Custom error class
│   ├── bcryptUtil.js        # Password hashing utilities
│   ├── formatterUtil.js     # Data formatting utilities
│   ├── jwtUtil.js           # JWT token utilities
│   ├── pagination.js        # Pagination utilities
│   ├── parseTokenUtil.js    # Token parsing utilities
│   ├── pickSafeFieldUtil.js # Safe field selection
│   └── responseUtil.js      # Response formatting
└── validations/             # Joi validation schemas
```

## Prerequisites

- Node.js v16 or higher
- npm v8 or higher
- MongoDB v5.0 or higher
- Environment variables configured

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Phone-Accessories
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with required environment variables:
```env
NODE_ENV=dev
PORT=3000
HOSTNAME=localhost
MONGODB_URI=mongodb://localhost:27017/phone-accessories
JWT_SECRET=your_jwt_secret_key
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password
```

## Available Scripts

### Development
```bash
npm run dev
```
Starts the development server with Nodemon (auto-reload on file changes)

### Production Build
```bash
npm run build
```
Compiles the source code to the `dist` directory

### Production Start
```bash
npm start
```
Runs the compiled production code

### Clean Build
```bash
npm run clean
```
Removes the `dist` directory

### Run Tests
```bash
npm test
```
Run test suite (not yet configured)

## API Documentation

Once the server is running, access the Swagger API documentation at:
- **Development**: `http://localhost:3000/api-docs`
- **Production**: API docs are disabled in production for security

## Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | string | Yes | `dev` | Execution environment (dev/prod) |
| `PORT` | number | No | `3000` | Server port |
| `HOSTNAME` | string | No | `localhost` | Server hostname |
| `MONGODB_URI` | string | Yes | - | MongoDB connection string |
| `JWT_SECRET` | string | Yes | - | Secret key for JWT signing |
| `MAIL_HOST` | string | No | - | SMTP mail server host |
| `MAIL_PORT` | number | No | `587` | SMTP mail server port |
| `MAIL_USER` | string | No | - | SMTP authentication username |
| `MAIL_PASS` | string | No | - | SMTP authentication password |

## Key Features Explained

### Authentication
- JWT-based token authentication
- Bcrypt password hashing for security
- Token validation and refresh mechanisms

### Error Handling
- Centralized error handling middleware
- Custom `ApiError` class for consistent error responses
- HTTP status code management

### Database
- MongoDB integration with Mongoose
- Automatic connection management
- Pagination support for list endpoints

### Validation
- Request validation using Joi schemas
- Custom validation middleware
- Automatic error reporting

### API Documentation
- Swagger/OpenAPI specification
- Auto-generated interactive API documentation
- Available in development environment only

## Getting Started

1. **Start MongoDB**: Ensure MongoDB is running on your local machine or update the connection string in `.env`

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**: Create and configure `.env` file

4. **Run in Development**:
   ```bash
   npm run dev
   ```

5. **Access API**:
   - API Base: `http://localhost:3000/`
   - Documentation: `http://localhost:3000/api-docs`

## Folder Import Aliases

This project uses import aliases for cleaner imports:

```javascript
// Instead of:
import { userController } from '../../../controllers/userController.js';

// Use:
import { userController } from '#controllers/userController.js';
```

Available aliases:
- `#configs/*`
- `#constants/*`
- `#controllers/*`
- `#middlewares/*`
- `#models/*`
- `#providers/*`
- `#repositories/*`
- `#routes/*`
- `#services/*`
- `#sockets/*`
- `#utils/*`
- `#validations/*`

## Development Tips

- Use `npm run dev` during development for automatic server restarts
- Check `src/utils/` for utility functions before creating duplicates
- Follow the existing folder structure for new features
- Use Joi schemas in `src/validations/` for request validation
- Extend `ApiError` class for application-specific errors

## Testing

Currently no tests are configured. To add tests:

```bash
npm install --save-dev jest supertest
```

Then update the test script in `package.json`.

## Error Handling

The API uses standardized error responses. All errors go through the `errorHandlingMiddleware` which formats them consistently.

Error codes are defined in `src/constants/errorCode.js`.

## License

ISC

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## Support

For issues, questions, or contributions, please open an issue in the repository.
