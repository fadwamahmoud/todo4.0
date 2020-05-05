var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const { hash } = require("./hashing");

var userSchema = new Schema({
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
  todos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Todo" }],
  kedaho: [{ type: mongoose.Schema.Types.ObjectId, ref: "Todo" }],
});

userSchema.pre("save", async function (next) {
  const userdoc = this;

  //hashing
  const hashed = await hash(userdoc.password);
  userdoc.password = hashed;
  next();
});
var User = mongoose.model("User", userSchema);

module.exports = User;
