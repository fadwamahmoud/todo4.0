require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const { DB_HOST } = require("./helpers");
const mongoose = require("mongoose");

mongoose.connect(
  DB_HOST,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
  (err) => {
    if (err) {
      console.log("connection error");
      process.exit();
    }
    console.log("connected successfully");
    app.listen(port, () =>
      console.log(`listening at http://localhost:${port}`)
    );
  }
);
mongoose.set("useUnifiedTopology", true);

module.exports = app;
