require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.use(cookieParser());
app.use(cors());
app.use(express.json());

const { MONGO_URI, PORT = 5000 } = process.env;

mongoose.connect(MONGO_URI);

const bookRoutes = require("./routes/bookRoutes");
const userRoutes = require("./routes/userRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const searchRoutes = require("./routes/searchRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const genreRoutes = require("./routes/genreRoutes");

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Swiss Book Club API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  })
);

app.use(errorHandler);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/genres", genreRoutes);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `📚 Swiss Book Club API Documentation available at: http://localhost:${PORT}/api-docs`
  );
});
