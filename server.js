require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Create in-memory mock database for fallback
let isUsingMockDatabase = false;
const mockDatabase = {
    users: [
        { id: 1, username: 'admin', password: 'admin123', email: 'admin@example.com', created_at: new Date() },
        { id: 2, username: 'user1', password: 'password123', email: 'user1@example.com', created_at: new Date() },
        { id: 3, username: 'user2', password: 'secret456', email: 'user2@example.com', created_at: new Date() }
    ],
    comments: [],
    commentIdCounter: 1
};

// Database connection attempt
let db;
try {
    console.log('Attempting to connect to MySQL database...');
    console.log('DB Config:', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });
    
    db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    // Connect to the database
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            console.error('Falling back to mock in-memory database for demonstration purposes');
            isUsingMockDatabase = true;
            return;
        }
        
        console.log('Connected to MySQL database');
        
        // Create tables if they don't exist
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        const createCommentsTable = `
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Execute create tables queries
        db.query(createUsersTable, (err) => {
            if (err) {
                console.error('Error creating users table:', err);
                return;
            }
            console.log('Users table checked/created');
            
            // Insert sample users if none exist
            db.query('SELECT COUNT(*) as count FROM users', (err, results) => {
                if (err) {
                    console.error('Error checking users count:', err);
                    return;
                }
                
                if (results[0].count === 0) {
                    const sampleUsers = `
                        INSERT INTO users (username, password, email) VALUES
                        ('admin', 'admin123', 'admin@example.com'),
                        ('user1', 'password123', 'user1@example.com'),
                        ('user2', 'secret456', 'user2@example.com')
                    `;
                    
                    db.query(sampleUsers, (err) => {
                        if (err) {
                            console.error('Error inserting sample users:', err);
                            return;
                        }
                        console.log('Sample users added');
                    });
                }
            });
        });
        
        db.query(createCommentsTable, (err) => {
            if (err) {
                console.error('Error creating comments table:', err);
                return;
            }
            console.log('Comments table checked/created');
        });
    });
} catch (error) {
    console.error('Critical error initializing database:', error);
    console.log('Falling back to mock in-memory database for demonstration purposes');
    isUsingMockDatabase = true;
}

// Routes
// Get all comments
app.get('/api/comments', (req, res) => {
    if (isUsingMockDatabase) {
        console.log('Using mock database for GET /api/comments');
        return res.json(mockDatabase.comments);
    }
    
    const sql = 'SELECT * FROM comments ORDER BY created_at DESC';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            console.log('Falling back to mock database');
            return res.json(mockDatabase.comments);
        }
        res.json(results);
    });
});

// Add a new comment
app.post('/api/comments', (req, res) => {
    // Log the received data for debugging
    console.log('Received comment data:', req.body);
    
    // Check if required fields are present
    if (!req.body || !req.body.name || !req.body.comment) {
        console.error('Missing required fields in request body');
        return res.status(400).json({ error: 'Name and comment are required fields' });
    }
    
    const { name, comment } = req.body;
    
    if (isUsingMockDatabase) {
        console.log('Using mock database for POST /api/comments');
        const newComment = {
            id: mockDatabase.commentIdCounter++,
            name,
            comment,
            created_at: new Date()
        };
        mockDatabase.comments.unshift(newComment); // Add to beginning of array
        return res.status(201).json(newComment);
    }
    
    // Vulnerable code - no sanitization of input!
    // This is intentional for the XSS demonstration
    const sql = 'INSERT INTO comments (name, comment) VALUES (?, ?)';
    
    db.query(sql, [name, comment], (err, result) => {
        if (err) {
            console.error('Error adding comment:', err);
            
            // Fallback to mock database if real database fails
            console.log('Falling back to mock database');
            const newComment = {
                id: mockDatabase.commentIdCounter++,
                name,
                comment,
                created_at: new Date()
            };
            mockDatabase.comments.unshift(newComment);
            return res.status(201).json(newComment);
        }
        
        // Return the newly created comment with ID
        const newComment = {
            id: result.insertId,
            name,
            comment,
            created_at: new Date()
        };
        
        console.log('Comment added successfully:', newComment);
        res.status(201).json(newComment);
    });
});

// Delete a comment
app.delete('/api/comments/:id', (req, res) => {
    const commentId = req.params.id;
    
    if (isUsingMockDatabase) {
        console.log('Using mock database for DELETE /api/comments/:id');
        const initialLength = mockDatabase.comments.length;
        mockDatabase.comments = mockDatabase.comments.filter(comment => comment.id !== parseInt(commentId));
        
        if (mockDatabase.comments.length === initialLength) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        return res.json({ message: 'Comment deleted successfully' });
    }
    
    const sql = 'DELETE FROM comments WHERE id = ?';
    
    db.query(sql, [commentId], (err, result) => {
        if (err) {
            console.error('Error deleting comment:', err);
            
            // Fallback to mock database
            console.log('Falling back to mock database for deletion');
            const initialLength = mockDatabase.comments.length;
            mockDatabase.comments = mockDatabase.comments.filter(comment => comment.id !== parseInt(commentId));
            
            if (mockDatabase.comments.length === initialLength) {
                return res.status(404).json({ error: 'Comment not found' });
            }
            
            return res.json({ message: 'Comment deleted successfully' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        res.json({ message: 'Comment deleted successfully' });
    });
});

// Get all users (vulnerable endpoint - should be protected in real applications)
// This is intentionally vulnerable for demonstration purposes
app.get('/api/users', (req, res) => {
    if (isUsingMockDatabase) {
        console.log('Using mock database for GET /api/users');
        return res.json(mockDatabase.users);
    }
    
    const sql = 'SELECT * FROM users';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.json(mockDatabase.users); // Fallback to mock data
        }
        res.json(results);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});