const express = require("express");

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Customer routes
router.post(
  "/",
  protect,
  authorize("CUSTOMER"),
  createOrder
);

router.get(
  "/my",
  protect,
  authorize("CUSTOMER"),
  getMyOrders
);

router.patch(
  "/:id/cancel",
  protect,
  authorize("CUSTOMER"),
  cancelOrder
);

// Admin routes
router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getAllOrders
);

router.patch(
  "/:id/status",
  protect,
  authorize("ADMIN"),
  updateOrderStatus
);

module.exports = router;