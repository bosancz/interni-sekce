var { Validator, ValidationError } = require('express-json-validator-middleware');

module.exports = function(err, req, res, next){
  
  
  if(err instanceof ValidationError){
    console.error("JSON Schema Validation Error");
    console.error("Url: " + req.url);
    console.error("Query:");
    console.error(req.query);
    console.error("Errors:");
    console.error(err.validationErrors);
    return res.status(400).json(err.validationErrors);
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).send("Invalid token.");
  }
  
  console.error(err);
  res.sendStatus(500);
};