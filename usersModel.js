const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { hash } = require("./hashing");
const customError = require("./customError");

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: true,
    minlength: [3, "can't be less than 3 characters"],
    maxlength: [15, "can't be more than 15 characters"],
  },
  firstname: { type: String, required: true },
  age: {
    type: Number,
    min: [13, "user can't be less than 13 years old"],
    optional: true,
  },
  todos: [{ type: Schema.Types.ObjectId, ref: "Todo" }],
});
//get todos by userId
userSchema.statics.findTodosByUserId = async function (userId) {
  return this.findOne({ _id: userId }, "todos").populate("todos");
};
userSchema.statics.findTodosByUsername = async function (username) {
  return this.findOne({ username: username }, "todos").populate("todos");
};
userSchema.statics.checkIfUserExists = async function (username) {
  return this.findOne({ username: username }, "todos").populate("todos");
};
userSchema.pre("save", async function (next) {
  const userdoc = this;

  //hashing
  const hashed = await hash(userdoc.password);
  userdoc.password = hashed;
  next();
});
const User = mongoose.model("User", userSchema);

module.exports = User;
