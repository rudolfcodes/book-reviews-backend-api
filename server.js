require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.use(cookieParser());
app.use(cors());
app.use(express.json());

const { MONGO_URI, PORT = 5000 } = process.env;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const bookRoutes = require("./routes/bookRoutes");
const userRoutes = require("./routes/userRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const searchRoutes = require("./routes/searchRoutes");

app.use(errorHandler);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/search", searchRoutes);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
