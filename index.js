require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const dns = require('node:dns')
const db = require('./queries')

// const { PrismaClient } = require('@prisma/client')

// const prisma = new PrismaClient();


// Declare and mount the body-parser as urlEncodedHandler
const urlEncodedHandler = bodyParser.urlencoded({ extended: false })
app.use(urlEncodedHandler);

// Root-level request logger middleware
// For testing purposes. Remove in production
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});


// Create a route that receives the POST data from the form. 
app.post('/api/shorturl', db.createUrl)

// Get all Stored URLS

app.get('/api/all-urls', db.getAllUrls)

// Find shortened URL and redirect
app.get('/api/shorturl/:id', db.getUrlById) 

