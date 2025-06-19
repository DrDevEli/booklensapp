# BookLens Backend

This is the backend service for the BookLens application, providing RESTful APIs for book management and user authentication.

## Project Structure

```
booklensapp-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   └── utils/          # Utility functions
├── docs/              # API documentation
├── tests/             # Test files
└── server.js          # Main application entry point
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis (optional, for caching)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
MONGODB_URI=your_mongodb_uri
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. For production:
   ```bash
   npm start
   ```

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## Testing

Run tests with:

```bash
npm test
```

## Features

- User authentication and authorization
- Book management
- Caching with Redis
- API documentation with Swagger
- Error handling and logging
- Security middleware
- Compression and CORS support
