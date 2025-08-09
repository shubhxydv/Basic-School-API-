const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create schools table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS schools (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(500) NOT NULL,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating schools table:', err);
        } else {
            console.log('Schools table is ready');
        }
    });
});

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

// Input validation middleware
const validateSchoolInput = (req, res, next) => {
    const { name, address, latitude, longitude } = req.body;
    
    // Check if all required fields are present
    if (!name || !address || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required: name, address, latitude, longitude'
        });
    }
    
    // Validate data types and ranges
    if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Name must be a non-empty string'
        });
    }
    
    if (typeof address !== 'string' || address.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Address must be a non-empty string'
        });
    }
    
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
            success: false,
            message: 'Latitude must be a number between -90 and 90'
        });
    }
    
    if (isNaN(lon) || lon < -180 || lon > 180) {
        return res.status(400).json({
            success: false,
            message: 'Longitude must be a number between -180 and 180'
        });
    }
    
    // Store parsed values back to req.body
    req.body.latitude = lat;
    req.body.longitude = lon;
    req.body.name = name.trim();
    req.body.address = address.trim();
    
    next();
};

// Add School API
app.post('/addSchool', validateSchoolInput, (req, res) => {
    const { name, address, latitude, longitude } = req.body;
    
    const insertQuery = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    
    db.query(insertQuery, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error('Error adding school:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to add school to database'
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'School added successfully',
            data: {
                id: result.insertId,
                name,
                address,
                latitude,
                longitude
            }
        });
    });
});

// List Schools API
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;
    
    // Validate user coordinates
    if (!latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: 'User latitude and longitude are required as query parameters'
        });
    }
    
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    
    if (isNaN(userLat) || userLat < -90 || userLat > 90) {
        return res.status(400).json({
            success: false,
            message: 'User latitude must be a number between -90 and 90'
        });
    }
    
    if (isNaN(userLon) || userLon < -180 || userLon > 180) {
        return res.status(400).json({
            success: false,
            message: 'User longitude must be a number between -180 and 180'
        });
    }
    
    // Fetch all schools from database
    const selectQuery = 'SELECT * FROM schools ORDER BY id';
    
    db.query(selectQuery, (err, schools) => {
        if (err) {
            console.error('Error fetching schools:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch schools from database'
            });
        }
        
        // Calculate distance for each school and sort by proximity
        const schoolsWithDistance = schools.map(school => {
            const distance = calculateDistance(userLat, userLon, school.latitude, school.longitude);
            return {
                id: school.id,
                name: school.name,
                address: school.address,
                latitude: school.latitude,
                longitude: school.longitude,
                distance_km: Math.round(distance * 100) / 100 // Round to 2 decimal places
            };
        });
        
        // Sort schools by distance (closest first)
        schoolsWithDistance.sort((a, b) => a.distance_km - b.distance_km);
        
        res.status(200).json({
            success: true,
            message: 'Schools fetched and sorted by proximity',
            user_location: {
                latitude: userLat,
                longitude: userLon
            },
            count: schoolsWithDistance.length,
            data: schoolsWithDistance
        });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'School Management API is running',
        timestamp: new Date().toISOString()
    });
});

// Handle undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`School Management API server is running on port ${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`- POST /addSchool`);
    console.log(`- GET /listSchools?latitude={lat}&longitude={lon}`);
    console.log(`- GET /health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing database connection...');
    db.end(() => {
        console.log('Database connection closed.');
        process.exit(0);
    });
});