require('dotenv').config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const dbConfig = require("./app/config/db.config");
const authConfig = require("./app/config/auth.config");
const JonSchedule = require("./app/controllers/cronjob.scheduler");
const app = express();
const oracledb = require('oracledb');

var corsOptions = {
  origin: "http://localhost:8081"
};

async function init(){
  try{
    await oracledb.createPool({
      user          : dbConfig.ORACLE_DB_USER,
      password      : dbConfig.ORACLE_DB_PASSWORD,               
      connectString : dbConfig.ORACLE_DB_CONNECTION_STRING,
      poolIncrement : 0,
      poolMax       : 10,
      poolMin       : 8
    });
    
  }catch(error){
console.log("error occured while connecting with oracledb",error);
  }
  
}
init();
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

app.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;
db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });
  
// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to  application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || authConfig.port;


cron.schedule("0 0 */1 * * *", function() {
  console.log("running a task every 1 hour");
  const job = new JonSchedule();
  job.startTaxRegistration();
  job.startPostCertificate();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }
        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}
