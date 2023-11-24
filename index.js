require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const dns = require('node:dns')

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient();
const pg = require('pg');

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
app.post('/api/shorturl', async (req, res) => {

  try {
    const { url } = req.body

    // Check host
    const validHost = await checkHost(url)
    console.log(validHost)

    // Check if the URL already exists in the database
    const existingUrl = await prisma.url_list.findUnique({
      where: {
        url: url
      }
    });

    // If the URL exists, return the existing record
    if (existingUrl) {
      return res.json(existingUrl);
    }

    // If the URL does not exist, create a new record
    const newUrl = await prisma.url_list.create({
      data: {
        url
      }
    });
    res.json(newUrl)
  } catch (error) {
    console.log(error.message)
    if (error.code === 'ENOTFOUND') {
      res.json({
        error: "Invalid URL"
      })
    } else {

      res.status(500).json({
        message: "Internal Server Error",
      })
    }
  }
})

// Get all Stored URLS

app.get('/api/all-urls', async (req, res) => {
  try {
    const urls = await prisma.url_list.findMany()

    res.json(urls)
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong"
    })
  }
})

// Find shortened URL and redirect
app.get('/api/shorturl/:id', async (req, res) => {
  try {
    const url = await prisma.url_list.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });
    if (url) {
      res.redirect(url.url)
    } else {
      res.json({
        error: "No short URL found for the given input"
      })
    }
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong"
    })
  }
})


async function checkHost(url) {
  return new Promise((resolve, reject) => {
    dns.lookup(url, (err, address) => {
      if (err) reject(err);
      resolve(address);
    });
  });
}