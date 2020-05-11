const express = require("express");
const router = express.Router();
const path = require("path");
require("dotenv").config();
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const util = require("util");
const { header, check, validationResult } = require("express-validator");
const User = require("./usersModel");
const { validator } = require("./middleware");
const { compare } = require("./hashing");
const customError = require("./customError");
const { JWT_SECRET } = require("./helpers");

//timestamp
// router.use(function timeLog(req, res, next) {
//   console.log("Time: ", Date.now());
//   next();
// });

//get all
router.get("/", (req, res) => {
  const myPath = path.join(__dirname, `./users.json`);
  res.sendFile(myPath);
});
//register
router.post(
  "/register",
  [
    validator("username", "password", "firstname"),
    check("password")
      .isLength({ min: 3, max: 15 })
      .withMessage("password must be 3-15 characters"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      //check if un and pw are sent
      const {
        body: { username, password, firstname },
      } = req;
      //new user here is the document sent to pre save
      const newUser = new User({
        username: username,
        password: password,
        firstname: firstname,
      });
      //sanitize
      const createdUser = await newUser.save();
      const instance = _.omit(createdUser.toJSON(), "password");
      return res.status(201).send(instance);
    } catch (error) {
      console.log(error);
    }
  }
);
//login
router.post(
  "/login",
  [validator("username", "password")],
  async (req, res, next) => {
    const {
      //unhashed
      body: { username, password },
    } = req;
    //check if username and pw exists
    try {
      const user = await User.findOne({ username });
      if (!user)
        throw new customError({
          message: "message goes here",
          status: 200,
          details: "details go here",
        });

      const isMatch = await compare(password, user.password);

      if (isMatch) {
        //generate token
        jwt.sign(
          { username },
          JWT_SECRET,
          { expiresIn: "60 days" },
          async (err, token) => {
            if (err) throw customError({ message: "problem logging in" });
            const todos = await User.findTodosByUsername(username);
            return res.status(200).send(token + todos);
          }
        );
        //send it
      } else {
        throw new Error("either un or pw is wrong");
      }
    } catch (Error) {
      next(Error.message);
    }
  }
);

router.get("/:username", (req, res, next) => {
  try {
    //promisify
    const vrfy = util.promisify(jwt.verify);
    //get token from req header
    //check if token is undefined
    const token = req.headers.authorization;
    vrfy(token, JWT_SECRET).then((payload) => {
      User.findOne({ username: payload.username }, "username", function (
        err,
        user
      ) {
        if (err) return res.status(404).send("could not find user");
        return res.status(200).send(user ? user : "not found");
      }).catch((error) => {
        next(error);
      });
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    //promisify
    const vrfy = util.promisify(jwt.verify);
    //get token from req header
    const token = req.headers.authorization;
    vrfy(token, JWT_SECRET)
      .then((payload) => {
        User.deleteOne({ username: payload.username }, function (err) {
          if (err) return res.status(404).send("could not delete");
          // deleted at most one tank document
          return res.status(200).send("user deleted");
        });
      })
      .catch((error) => {
        next(error);
      });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/",
  [header("authorization").notEmpty().withMessage("not authorized")],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    //check for authorization
    try {
      //promisify
      const vrfy = util.promisify(jwt.verify);

      //get token from req header
      const token = req.headers.authorization;
      vrfy(token, JWT_SECRET).then((payload) => {
        //create new user with only the provided fields
        const editedUser = { $set: req.body };
        User.updateOne({ username: payload.username }, editedUser, function (
          err,
          user
        ) {
          if (err) return res.status(404).send("could not find user");
          return res.status(200).send(user ? user : "not found");
        }).catch((error) => {
          next(error);
        });
      });
    } catch (error) {
      next(error);
    }
  }
);
module.exports = router;
