# School Management API

A Node.js REST API for managing school data with location-based sorting functionality.

## Features

- Add new schools with location data
- Retrieve schools sorted by proximity to user location
- Input validation and error handling
- MySQL database integration
- CORS support for cross-origin requests

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn package manager

## Installation

1. **Clone or create the project directory:**
   ```bash
   mkdir school-management-api
   cd school-management-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up MySQL database:**
   - Create a MySQL database named `school_management`
   - Update the `.env` file with your MySQL credentials

4. **Configure environment variables:**
   - Copy the `.env` file and update the database credentials
   - The application will automatically create the `schools` table on startup

5. **Start the server:**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### 1. Health Check
- **Endpoint:** `GET /health`
- **Description:** Check if the API is running
- **Response:**
  ```json
  {
    "success": true,
    "message": "School Management API is running",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
  ```

### 2. Add School
- **Endpoint:** `POST /addSchool`
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "name": "ABC Public School",
    "address": "123 Main Street, City, State",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
  ```
- **Validation Rules:**
  - All fields are required
  - `name` and `address` must be non-empty strings
  - `latitude` must be between -90 and 90
  - `longitude` must be between -180 and 180
- **Success Response (201):**
  ```json
  {
    "success": true,
    "message": "School added successfully",
    "data": {
      "id": 1,
      "name": "ABC Public School",
      "address": "123 Main Street, City, State",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
  ```

### 3. List Schools
- **Endpoint:** `GET /listSchools`
- **Query Parameters:**
  - `latitude` (required): User's latitude (-90 to 90)
  - `longitude` (required): User's longitude (-180 to 180)
- **Example:** `GET /listSchools?latitude=40.7589&longitude=-73.9851`
- **Description:** Returns all schools sorted by distance from user location
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Schools fetched and sorted by proximity",
    "user_location": {
      "latitude": 40.7589,
      "longitude": -73.9851
    },
    "count": 2,
    "data": [
      {
        "id": 1,
        "name": "Nearest School",
        "address": "123 Close Street",
        "latitude": 40.7500,
        "longitude": -73.9800,
        "distance_km": 2.45
      },
      {
        "id": 2,
        "name": "Farther School",
        "address": "456 Far Avenue",
        "latitude": 40.6500,
        "longitude": -74.1000,
        "distance_km": 15.72
      }
    ]
  }
  ```

## Error Handling

All API endpoints return structured error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation error)
- `404`: Endpoint not found
- `500`: Internal server error

## Database Schema

### Schools Table
```sql
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Distance Calculation

The API uses the Haversine formula to calculate the great-circle distance between two points on Earth's surface, providing accurate distance measurements in kilometers.

## Testing with Postman

1. Import the provided Postman collection
2. Set up environment variables if needed
3. Test the endpoints with sample data

## Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set environment variables in production
2. Ensure MySQL database is accessible
3. Run: `npm start`

### Popular Hosting Options
- **Heroku**: Easy deployment with ClearDB MySQL add-on
- **Railway**: Simple Node.js and MySQL hosting
- **DigitalOcean**: VPS with full control
- **AWS/Google Cloud**: Scalable cloud solutions

## Project Structure

```
school-management-api/
├── server.js          # Main application file
├── package.json       # Project dependencies and scripts
├── .env              # Environment variables
├── README.md         # Project documentation
└── postman/          # Postman collection (if created)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.