// Import required modules
const express = require('express'); // Express.js framework for building web applications
const mongoose = require('mongoose'); // Mongoose for MongoDB object modeling
const { body, validationResult } = require('express-validator'); // Validation middleware for Express.js
const methodOverride = require('method-override'); // Middleware for handling PUT and DELETE requests
const app = express(); // Create an Express application

app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/my_database'); // Connect to MongoDB
const db = mongoose.connection; // Get the default connection
db.on('error', console.error.bind(console, 'MongoDB connection error:')); // Log MongoDB connection error

// Define a schema for your data
const userSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: String
});

// Define a model based on the schema
const User = mongoose.model('User', userSchema); // Create a User model from the schema

// Middleware to parse JSON requests
app.use(express.json());
// Middleware to parse form data
app.use(express.urlencoded({ extended: false }));
// Middleware for handling PUT and DELETE requests
app.use(methodOverride('_method'));
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Render the form for creating a new user
app.get('/users/new', (req, res) => {
    res.render('new-user', { errors: null }); // Render the new-user form with no errors initially
});

// Create a new user
app.post('/users', [
    // Validate name, age, and email fields
    body('name').isLength({ min: 4 }).withMessage('Name is required with min. 4 chars'),
    body('age').isInt({ min: 18 }).withMessage('Age must be a number greater than 18'),
    body('email').isEmail().withMessage('Invalid email address')
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('new-user', { errors: errors.array() }); // Render the new-user form with validation errors
    }

    try {
        const user = new User(req.body); // Create a new User instance
        await user.save(); // Save the new user to the database
        res.redirect('/users'); // Redirect to the user list page
    } catch (err) {
        res.status(500).send(err); // Handle server error
    }
});

// Get all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find(); // Find all users in the database
        res.render('user-list', { users }); // Render the user-list view with the retrieved users
    } catch (err) {
        res.status(500).send(err); // Handle server error
    }
});

// Edit a user form
app.get('/users/:id/edit', async (req, res) => {
    try {
        const user = await User.findById(req.params.id); // Find user by ID
        if (!user) {
            return res.status(404).send('User not found'); // If user not found, return 404
        }
        res.render('edit-user', { user, errors: null }); // Render the edit-user form with the user data
    } catch (err) {
        res.status(500).send(err); // Handle server error
    }
});

// Update a user
app.put('/users/:id', [
    // Validate name, age, and email fields
    body('name').isLength({ min: 4 }).withMessage('Name is required with min. 4 chars'),
    body('age').isInt({ min: 18 }).withMessage('Age must be a number greater than 18'),
    body('email').isEmail().withMessage('Invalid email address')
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const user = await User.findById(req.params.id); // Find user by ID
        return res.render('edit-user', { user, errors: errors.array() }); // Render the edit-user form with validation errors
    }

    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Find user by ID and update
        if (!user) {
            return res.status(404).send('User not found'); // If user not found, return 404
        }
        res.redirect('/users'); // Redirect to the user list page
    } catch (err) {
        res.status(500).send(err); // Handle server error
    }
});

// Delete a user
app.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id); // Find user by ID and delete
        if (!user) {
            return res.status(404).send('User not found'); // If user not found, return 404
        }
        res.redirect('/users'); // Redirect to the user list page
    } catch (err) {
        res.status(500).send(err); // Handle server error
    }
});

// Start the server
const PORT = 3000; // Define server port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`); // Log server start message
});
