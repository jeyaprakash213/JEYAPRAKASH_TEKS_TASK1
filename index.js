const express = require('express');
const connectDB = require('./db');
const userController = require('./users');
const app = express();
const PORT = process.env.PORT || 3000;


// Connect to MongoDB
connectDB();

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// signup && login
app.post('/api/register', userController.create);
app.post('/api/login', userController.authenticate);
app.put("/verify-mobile-email", userController.updateById);





// Server start
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});