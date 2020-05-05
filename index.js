const express = require("express");
const app = express();
const port = 3000;
const usersAPI = require("./usersAPI.js");
const todosAPI = require("./todosAPI.js");
var mongoose = require("./connections.js");

//establish connection
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
// irrecoverable error
db.once("open", function () {
  console.log("dewf");
  // we're connected!
});

//middleware
app.use((req, res, next) => {
  var today = new Date();
  var time =
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

app.listen(port, () => console.log(`listening at http://localhost:${port}`));
