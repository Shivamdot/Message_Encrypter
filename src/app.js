const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const {v4 : uuidv4} = require('uuid')

let con = mysql.createConnection({
  host: "database-1.cnnqr16ujokn.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "12345678",
  port: "3306",
  database: "neha"
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
      res.json({msg: "success", link: `https://neha-submission.herokuapp.com/read/${MsgID}`, otp});
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

app.post('/read', (req, res) => {
  let {MsgID, otp} = req.body;

  if(!MsgID || !otp) return res.json({msg: "error", error: "MsgID or otp is not provided!"});

  let searchMSG = `SELECT * FROM messages WHERE MsgID = '${MsgID}'`;

  // Search the encrypted MSG from MsgID
  con.query(searchMSG, function (err, result) {
    if(err) {  
      return res.json({msg: "error", error: "Not able to read records from database!"});
    }

    // MSG Found
    if(result.length > 0) {
      let {Message} = result[0];

      // Decrypting MSG with given otp
      jwt.verify(Message, otp.toString(), (err, decoded) => {
        let deleteMSG = `DELETE FROM messages WHERE MsgID = '${MsgID}'`;
        if(err) {
          // OTP Invalid ,delete the message
          return con.query(deleteMSG, function (er, result) {
            if(er) {  
              return res.json({msg: "error", error: "Not able to read records from database!"});
            }
            console.log(`Record with MsgID: ${MsgID} is deleted!`);
            return res.json({msg: "error", error: "Invalid OTP Message Deleted!"});
          });
        }

        // Valid OTP return MSG
        let decryptedMSG = decoded.msg;

        con.query(deleteMSG, function (er, result) {
          if(er) {  
            return res.json({msg: "error", error: "Not able to read records from database!"});
          }
          console.log(`Record with MsgID: ${MsgID} is deleted!`);
          res.json({msg: "success", decryptedMSG});
        });
      });
    } 
    
    // MSG Not Found
    else {
      res.json({msg: "error", error: "Messages Not Found!"});
    }
  });
})

let port = process.env.PORT || 2000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});