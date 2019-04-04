var bcrypt = require("bcryptjs");

var config = require("../../config");

var mongoose = require("../db");

var User = require("../models/user");

bcrypt.hash("admin", config.bcrypt.rounds)
  .then(hash => User.findOneAndUpdate({_id: "admin"}, { password: hash, roles: ["spravce"] }, {upsert: true, new:true}))
  .then(user => {
    console.log("Created user: ", user);
    process.exit();
  })
  .catch(err => {
    console.error("Error when creating user:");
    console.error(err);
    process.exit();
  })
