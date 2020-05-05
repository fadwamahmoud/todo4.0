var bcrypt = require("bcryptjs");
const SALT_ROUNDS = 10;
const hash = async (text) => {
  return bcrypt.hash(text, SALT_ROUNDS);
};
const compare = async (pw, hashedpw) => {
  return bcrypt.compare(pw, hashedpw);
};
module.exports = { hash, compare };
