var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var todoSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  title: {
    type: String,
    required: [true, "title is required"],
    minlength: [5, "min is 5"],
    maxlength: [20, "max is 20"],
  },
  status: { type: String, optional: true, default: "to-do" },
  tags: {
    type: [{ type: String, maxlength: 10 }],
    optional: true,
    maxlength: 10,
  },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

var Todo = mongoose.model("Todo", todoSchema);
module.exports = Todo;
