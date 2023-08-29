const express = require('express');
const app = express();
const mongoose = require("mongoose");           
const port = 8000;
require("dotenv").config();
app.set('view engine', 'ejs')
const path = require("path");
const createError = require('http-errors');
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true,})
const bodyparser = require('body-parser');
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json());
app.use('/images', express.static(path.join(__dirname, 'BlogImages')));
  const routes = require('./Site/routes');
  app.set("views", path.join(__dirname, '/Site/views'));
  function traverseObject(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverseObject(obj[key]); // Recursively call the function for nested objects
      } else {
        console.log(`${key}: ${obj[key](app)}`);
      }
    }
  }
  traverseObject(routes);
if (process.env.NODE_ENV === 'development') {
    app.use(require('morgan')('dev'));
}

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});  