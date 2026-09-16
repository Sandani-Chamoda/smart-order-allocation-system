const express = require("express");

const {
  getBranches,
  createBranch,
  updateStock,
} = require("../controllers/branchController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Branch information is admin-only
router.get("/", protect, authorize("ADMIN"), getBranches);

router.post("/", protect, authorize("ADMIN"), createBranch);

router.put(
  "/:id/stock",
  protect,
  authorize("ADMIN"),
  updateStock
);

module.exports = router;