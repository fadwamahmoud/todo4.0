//global error handler
function errorHandler(res) {
  return res.status(500).send("internal server error");
}
module.exports = {
  errorHandler,
};
