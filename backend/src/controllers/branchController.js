const Branch = require("../models/Branch");
const Product = require("../models/Product");

// GET /api/branches
const getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find()
      .populate("stock.productId", "name sku price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: branches.length,
      branches,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/branches
const createBranch = async (req, res, next) => {
  try {
    const { name, location, currentWorkload } = req.body;

    if (
      !name ||
      !location ||
      location.latitude === undefined ||
      location.longitude === undefined
    ) {
      res.status(400);
      throw new Error("Name, latitude and longitude are required");
    }

    const branch = await Branch.create({
      name,
      location,
      currentWorkload: currentWorkload ?? 0,
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      branch,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/branches/:id/stock
const updateStock = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      res.status(400);
      throw new Error("Product ID and quantity are required");
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
      res.status(400);
      throw new Error("Stock quantity must be a non-negative integer");
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      res.status(404);
      throw new Error("Active product not found");
    }

    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    const stockItem = branch.stock.find(
      (item) => item.productId.toString() === productId
    );

    if (stockItem) {
      stockItem.quantity = Number(quantity);
    } else {
      branch.stock.push({
        productId,
        quantity: Number(quantity),
      });
    }

    await branch.save();

    const updatedBranch = await Branch.findById(branch._id).populate(
      "stock.productId",
      "name sku price"
    );

    res.status(200).json({
      success: true,
      message: "Branch stock updated successfully",
      branch: updatedBranch,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBranches,
  createBranch,
  updateStock,
};