require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const pg = require('pg');



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// Connect to PostgreSQL Database (ElephantSQL)
const client= new pg.Client(process.env.ELEPHANTSQL_URI)
client.connect