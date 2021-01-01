const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const {v4 : uuidv4} = require('uuid')

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
      console.log("Not able to check available tables");
      return;
    }

    if(result.length == 0) {
      let createTable = "CREATE TABLE messages (MsgID VARCHAR(255) PRIMARY KEY, Message VARCHAR(1000))";
  
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
  let {msg} = req.body;
  if(msg) {

    let MsgID = uuidv4();
    let otp = Math.floor(1000 + Math.random() * 9000).toString();

    let data = {MsgID, msg};
    
    let encryptedMSG = jwt.sign(data, otp);

    let insertValue = `INSERT INTO messages (MsgID, Message) VALUES ('${MsgID}', '${encryptedMSG}')`;

    con.query(insertValue, function (err, result) {
      if(err) {
        return res.json({msg: "error", error: "Not able to add records into database!"});
      }
      console.log(`Record with MsgID: ${MsgID} is added!`);
      res.json({msg: "success", link: `http://localhost:2000/read/${MsgID}`, otp});
    });
    
  } else {
    res.json({msg: "error", error: "msg data objetc not present"});
  }
});

app.get('/read/:id', (req, res) => {
  let MsgID = req.params.id.toString();

  let searchMSG = `SELECT * FROM messages WHERE MsgID = '${MsgID}'`;

  con.query(searchMSG, function (err, result) {
    if(err) {  
      return res.render('error.hbs');
    }
    if(result.length > 0) {
      res.render('read.hbs', {MsgID});
    } else {
      res.render('error.hbs');
    }
  });
});

let port = process.env.PORT || 2000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});