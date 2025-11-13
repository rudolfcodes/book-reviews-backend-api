require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger");
const errorHandler = require("./middlewares/errorHandler");
require("./schedulers/eventScheduler"); // Start the cron job

const app = express();
app.use(cookieParser());
app.use(cors());
app.use(express.json());

const { MONGO_URI, PORT = 5000 } = process.env;

mongoose.connect(MONGO_URI);

const userRoutes = require("./routes/userRoutes");
const bookClubRoutes = require("./routes/bookClubRoutes");
const cityRoutes = require("./routes/cityRoutes");
const eventRoutes = require("./routes/eventRoutes");

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
app.use("/api/users", userRoutes);
app.use("/api/bookclubs", bookClubRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/events", eventRoutes);

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
