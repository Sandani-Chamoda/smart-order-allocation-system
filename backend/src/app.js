const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");

const {
  protect,
  authorize,
} = require("./middleware/authMiddleware");
const productRoutes = require("./routes/productRoutes");
const branchRoutes = require("./routes/branchRoutes");

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

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/branches", branchRoutes);

app.get(
  "/api/admin/test",
  protect,
  authorize("ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  }
);

app.use(notFound);
app.use(errorHandler);


module.exports = app;