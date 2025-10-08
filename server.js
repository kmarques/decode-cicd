const { app, mongoose } = require("./app");
const process = require("node:process");

app.listen(process.env.PORT, function () {
  console.log("Server is listening on port " + process.env.PORT);
});

app.on("close", function () {
  mongoose.connection.close();
});
