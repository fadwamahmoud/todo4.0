const express = require("express");
const router = express.Router();
const url = require("url");
const { header, param, validationResult } = require("express-validator");
var mongoose = require("mongoose");
const { validator } = require("./middleware");
require("dotenv").config();
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const util = require("util");
const { JWT_SECRET } = require("./helpers");
const customError = require("./customError");
const Todo = require("./todosModel");
const User = require("./usersModel");
//get pagination
router.get("", async (req, res, next) => {
  // const queryObject = url.parse(req.url, true).query;
  const pageOptions = {
    skip: parseInt(req.query.skip, 10) || 0,
    limit: parseInt(req.query.limit, 10) || 10,
  };

  Todo.find(
    {},
    { title: 1, status: 1, _id: 0, tags: 1 },
    { skip: pageOptions.skip, limit: pageOptions.limit },
    (err, todos) => {
      return res.status(200).send(todos);
    }
  );
});

//get
router.get(
  "/:userId",
  [
    param("userId").notEmpty().withMessage("provide a user id"),
    header("authorization").notEmpty().withMessage("not authorized"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      //promisify
      const vrfy = util.promisify(jwt.verify);
      //get token from req header
      const token = req.headers.authorization;
      vrfy(token, JWT_SECRET).then(async (payload) => {
        User.findTodosByUserId(req.params.userId).then(function (user) {
          return res.status(200).send(user ? user : "not found");
        });
      });
    } catch (error) {
      next(error);
    }
  }
);

//patch
router.patch(
  "/:id",
  [header("authorization").notEmpty().withMessage("not authorized")],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      //promisify
      const vrfy = util.promisify(jwt.verify);
      //get token from req header
      const token = req.headers.authorization;
      vrfy(token, JWT_SECRET).then(() => {
        const editedTodo = { $set: req.body };
        Todo.updateOne({ _id: req.params.id }, editedTodo, function (
          err,
          todos
        ) {
          if (err) throw new customError({ message: "couldn't find todo" });
          const modified = todos.n;
          if (modified === 0)
            return res.status(404).send("could not edit todos");

          return res.status(200).send("edited succesfully");
        }).catch((error) => {
          next(error);
        });
      });
    } catch (error) {
      next(error);
    }
  }
);

//delete
router.delete(
  "/:id",
  [
    param("id").notEmpty().withMessage("provide a todo id"),
    header("authorization").notEmpty().withMessage("not authorized"),
  ],
  async (req, res, next) => {
    try {
      //promisify
      const vrfy = util.promisify(jwt.verify);
      //get token from req header
      const token = req.headers.authorization;
      vrfy(token, JWT_SECRET)
        .then(() => {
          Todo.deleteOne({ _id: req.params.id }, function (err) {
            if (err) return res.status(404).send("could not delete");
            return res.status(200).send("todo deleted successfully");
          });
        })
        .catch((error) => {
          next(error);
        });
    } catch (error) {
      next(error);
    }
  }
);

//post
router.post(
  "/",
  [
    validator("username", "title"),
    header("authorization").notEmpty().withMessage("not authorized"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const {
        body: { username, title, tags },
      } = req;

      //find user id
      User.findOne({ username: username }, "_id", async (err, user) => {
        if (err) {
          throw new customError({
            message: "couldn't find user",
            status: 404,
            details: "user not found",
          });
        }
        //new user here is the document sent to pre
        const newTodo = new Todo({
          username: username,
          title: title,
          tags: tags,
          userId: user.id,
        });
        const createdTodo = await newTodo.save();
        //add todo id to user todos array
        User.updateOne(
          { username: username },
          { $push: { todos: createdTodo.id } },
          (err, user) => {
            if (err)
              throw new customError({
                message: "couldn't update user's todos",
                status: 404,
                details: "couldn't update user's todos",
              });
          }
        );
        return res.status(201).send(createdTodo.toJSON());
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
