const express = require('express');

// Import the database configuration
require('./config/db');

const app = express();
const port = 3000;
const userrouter = require('./api/user');

// Use express.json() middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Use express.urlencoded() middleware to parse incoming requests with URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

// Mount your user router under the '/users' path
app.use('/users', userrouter);

// Your other routes and middleware setup go here

app.listen(port, () => {
    console.log(`Server Running successfully on the port ${port}`);
});
