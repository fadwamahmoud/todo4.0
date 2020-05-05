const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
var _ = require("lodash");
var jwt = require("jsonwebtoken");
const util = require("util");
const { errorHandler } = require("./fn");
var User = require("./usersModel");
var Todo = require("./todosModel");
const { compare } = require("./hashing");

//timestamp
// router.use(function timeLog(req, res, next) {
//   console.log("Time: ", Date.now());
//   next();
// });

PRIVATE_KEY = "fnewjinewjjf";
//get all
router.get("/", (req, res) => {
  const myPath = path.join(__dirname, `./users.json`);
  res.sendFile(myPath);
});
//register
router.post("/register", async (req, res) => {
  try {
    //check if un and pw are sent
    const {
      body: { username, password, firstname },
    } = req;
    //new user here is the document sent to pre
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
});
//login
router.post("/login", async (req, res) => {
  const {
    //unhashed
    body: { username, password },
  } = req;

  const user = await User.findOne({ username });
  const isMatch = await compare(password, user.password);
  try {
    if (isMatch) {
      //generate token
      jwt.sign(
        { username },
        PRIVATE_KEY,
        { expiresIn: "60m" },
        (err, token) => {
          if (err) throw Error("error occurred");
          return res.status(200).send(token);
        }
      );
      //send it
    }
    throw new Error("either un or pw is wrong");
  } catch (Error) {
    console.log(Error);
  }

  // User.findOne({ username: username })
  //   .populate("kedaho")
  //   .exec((err, todos) => {
  //     if (err) return res.status(404).send(err.message);
  //     // saved!
  //     console.log("Populated User " + todos);
  //     return res.status(200).send(todos);
  //   });
});

router.get("/:username", (req, res, next) => {
  try {
    //promisify
    const vrfy = util.promisify(jwt.verify);
    //get token from req header
    const token = req.headers.authorization;
    vrfy(token, PRIVATE_KEY).then((payload) => {
      User.findOne({ username: payload.username }, "username", function (
        err,
        user
      ) {
        if (err) return res.status(404).send("could not find user");
        // deleted at most one tank document
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
    vrfy(token, PRIVATE_KEY)
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

module.exports = router;
