const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const jwt = require('jsonwebtoken');

var app = express();

// Adding necessary Headers to handle Client side requests
app.use(cors());

app.use(bodyParser.json());

app.set('view engine', 'hbs');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('home.hbs');
});

app.post('/', (req, res) => {
  let data = req.body;
  console.log(data);
  res.json({msg: "success"});
});

let port = process.env.PORT || 2000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});