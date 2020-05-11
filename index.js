const express = require("express");
const usersAPI = require("./usersAPI.js");
const todosAPI = require("./todosAPI.js");
const app = require("./connections.js");

//middleware
app.use((req, res, next) => {
  const today = new Date();
  const time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  console.log(req.url, req.method, time);
  next();
});

//body parsing
app.use(express.json());

//users
app.use(["/user"], usersAPI);
//todos
app.use(["/todo"], todosAPI);
