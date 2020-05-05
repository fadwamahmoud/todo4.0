const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { errorHandler } = require("./fn");
var Todo = require("./todosModel");
var User = require("./usersModel");

//get
router.get(["/", "/:username"], (req, res) => {
  const myPath = path.join(__dirname, "./todo.json");
  if (req.params.username !== undefined) {
    fs.readFile("./todo.json", { encoding: "utf8" }, (err, data) => {
      if (err) {
        errorHandler(res);
      }
      // //parse
      const parsedTodos = JSON.parse(data).filter(
        (todo) => todo.username == req.params.username
      );
      return res.status(200).send(parsedTodos);
    });
  } else {
    res.sendFile(myPath);
  }
});

//post
router.post("/", (req, res) => {
  const {
    body: { title, tags, username },
  } = req;

  User.findOne({ username: username }, "_id", function (err, user) {
    if (err) return res.status(404).send(err.message);
    var newTodo = new Todo({
      title: title,
      userId: user,
      tags: tags,
    });
    newTodo.save(function (err, data) {
      if (err) return res.status(404).send(err.message);
      return res.status(200).send(data);
    });
  });
});

//delete
router.delete("/:id", (req, res) => {
  fs.readFile("./todo.json", { encoding: "utf8" }, (err, data) => {
    if (err) {
      return res.status(500).send("something went wrong");
    }
    //parse
    const parsedTodos = JSON.parse(data);

    //find by id
    const id = parseInt(req.params.id);
    const obj = parsedTodos.find((todo) => todo.id == id);
    const index = parsedTodos.indexOf(obj);

    //delete obj
    if (index !== -1) {
      parsedTodos.splice(index, 1);
    } else {
      return res.status(404).send("id not found");
    }

    //save new list
    fs.writeFile("./todo.json", JSON.stringify(parsedTodos), "utf8", (err) => {
      if (err) {
        errorHandler(res);
      }
      return res.status(200).send("deleted successfully");
    });
  });
});

//patch
router.patch("/:id", (req, res) => {
  fs.readFile("./todo.json", { encoding: "utf8" }, (err, data) => {
    if (err) {
      errorHandler(res);
    }
    //parse
    const parsedTodos = JSON.parse(data);

    //find by id
    const id = parseInt(req.params.id);
    const obj = parsedTodos.find((todo) => todo.id == id);
    const index = parsedTodos.indexOf(obj);

    const {
      body: { title, status },
    } = req;

    if (index !== -1) {
      //create new obj edited
      const editedTodo = { ...parsedTodos[index] };
      if (title !== undefined && status !== undefined) {
        editedTodo.title = title;
        editedTodo.status = status;

        //replace obj in that index with new obj
        parsedTodos[index] = editedTodo;

        //save into file
        fs.writeFile(
          "./todo.json",
          JSON.stringify(parsedTodos),
          "utf8",
          (err) => {
            if (err) {
              errorHandler(res);
            }
            return res.status(200).send("edited successfully");
          }
        );
      } else {
        return res.status(400).send("invalid attributes");
      }
    } else {
      return res.status(400).send("id not found");
    }
  });
});

module.exports = router;
