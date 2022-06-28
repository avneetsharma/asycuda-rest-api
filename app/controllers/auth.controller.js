const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const tokenList = {}


var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  try{
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: config.tokenLife // 24 hours
      });
      var refreshToken = jwt.sign({ id: user.id }, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife})

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      
       
      tokenList[refreshToken] = {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token,
        refreshToken:refreshToken
       };
       
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token,
        refreshToken:refreshToken
      });
    });
  }
    catch(err){
      res.status(500).send({ message: err });
    }
};


exports.newToken = (req, res) => {
  const postData = req.body
  // if refresh token exists
  if((postData.refreshToken) && (postData.refreshToken in tokenList)) {
      var user_id= tokenList[postData.refreshToken].id;
      const token = jwt.sign({ id: user_id }, config.secret, { expiresIn: config.tokenLife})
      // update the token in the list
      tokenList[postData.refreshToken].token = token
      res.status(200).send({
        id: tokenList[postData.refreshToken].id,
        username: tokenList[postData.refreshToken].username,
        email: tokenList[postData.refreshToken].email,
        roles: tokenList[postData.refreshToken].roles,
        accessToken: token,
        refreshToken:tokenList[postData.refreshToken].refreshToken
      });
      //res.status(200).json(response);        
  } else {
      res.status(400).send('Invalid request')
  }
};