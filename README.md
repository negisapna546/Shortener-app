# Advanced URL Shortener with Analytics

A scalable URL shortener service with comprehensive analytics, custom aliases, and rate limiting. Built with Node.js, Express, MongoDB, and Redis.

## Features

- **User Authentication**
  - Google Sign-In integration
  - JWT-based authentication
  - Secure session management

- **URL Management**
  - Create short URLs with optional custom aliases
  - Group URLs by topics (acquisition, activation, retention)
  - Rate limiting to prevent abuse
  - Automatic short URL generation using nanoid

- **Advanced Analytics**
  - Track total clicks and unique visitors
  - OS and device type statistics
  - Geolocation tracking
  - Time-based analytics
  - Topic-based grouping and analysis

- **Performance Optimization**
  - Efficient database indexing
  - Rate limiting with Redis
  - Docker containerization

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Caching**: Redis
- **Authentication**: Passport.js, Google OAuth 2.0
- **Analytics**: Custom implementation with MongoDB aggregation
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker, Docker Compose

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- Docker and Docker Compose (for containerized deployment)
- Google OAuth 2.0 credentials

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/url-shortener.git
   cd url-shortener
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration

4. Start the application:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Docker Deployment

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. The application will be available at `http://localhost:3000`

## API Documentation

### Authentication Endpoints

- `GET /api/auth/google`: Initiate Google OAuth2.0 authentication
- `GET /api/auth/google/callback`: OAuth2.0 callback handler
- `POST /api/auth/logout`: Logout user

### URL Endpoints

- `POST /api/shorten`: Create short URL
  ```json
  {
    "longUrl": "https://example.com/very-long-url",
    "customAlias": "custom-alias",
    "topic": "acquisition"
  }
  ```

- `GET /api/shorten/{alias}`: Redirect to original URL

### Analytics Endpoints

- `GET /api/analytics/{alias}`: Get URL-specific analytics
- `GET /api/analytics/topic/{topic}`: Get topic-based analytics
- `GET /api/analytics/overall`: Get overall analytics

## Rate Limiting

- URL Creation: 10 requests per minute per user
- Analytics Requests: 30 requests per minute per user

## Caching Strategy

- Short URLs: 24 hours
- Analytics Data: 5 minutes
- Rate Limiting Data: 1 minute

## Security Measures

- JWT-based authentication
- Rate limiting
- Helmet.js security headers
- CORS configuration
- Environment variable protection
- Input validation

## Monitoring and Logging

- Winston logger integration
- Docker container logs
- Redis monitoring
- MongoDB performance monitoring

## Development

1. Run tests:
   ```bash
   npm test
   ```

2. Access API documentation:
   ```
   http://localhost:3000/api-docs
   ```

## Production Deployment

1. Update environment variables for production
2. Build and push Docker images
3. Deploy using docker-compose or your preferred cloud service
4. Set up monitoring and logging
5. Configure domain and SSL certificates

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
