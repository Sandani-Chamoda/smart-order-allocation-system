const express = require("express");

const {
  getProducts,
  createProduct,
  updateProduct,
} = require("../controllers/productController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Customers can browse active products
router.get("/", getProducts);

// Only admins can manage products
router.post("/", protect, authorize("ADMIN"), createProduct);
router.put("/:id", protect, authorize("ADMIN"), updateProduct);

module.exports = router;