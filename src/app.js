const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "learning"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("MySQL Connected!");

  let checkTable = 'show tables like "messages"';

  con.query(checkTable, function (err, result) {
    if(err) {
      console.log("Not able to able to check available tables");
      return;
    }

    if(result.length == 0) {
      let createTable = "CREATE TABLE messages (MsgID VARCHAR(255) PRIMARY KEY, Message VARCHAR(255))";
  
      con.query(createTable, function (err, result) {
        if(err) {
          console.log("Not able to create meassages table");
          return;
        }
        console.log("messages Table created");
      });  
    }
  });
  
  
});

let app = express();

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