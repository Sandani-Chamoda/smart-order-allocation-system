const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

// Security headers
app.use(helmet());

// Allow frontend requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Request logging during development
app.use(morgan("dev"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Order Allocation API is running",
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;