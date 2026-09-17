const mongoose = require("mongoose");

const Product = require("../models/Product");
const Branch = require("../models/Branch");
const Order = require("../models/Order");
const allocateBranch = require("../services/allocationService");

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { items, customerLocation, customerMessage } = req.body;

    // --------------------------------------------------
    // 1. Validate order items
    // --------------------------------------------------
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("At least one order item is required");
    }

    // --------------------------------------------------
    // 2. Validate customer location
    // --------------------------------------------------
    if (
      !customerLocation ||
      customerLocation.latitude === undefined ||
      customerLocation.longitude === undefined
    ) {
      res.status(400);
      throw new Error("Customer location is required");
    }

    const latitude = Number(customerLocation.latitude);
    const longitude = Number(customerLocation.longitude);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      res.status(400);
      throw new Error(
        "Latitude must be a number between -90 and 90"
      );
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      res.status(400);
      throw new Error(
        "Longitude must be a number between -180 and 180"
      );
    }

    const validatedLocation = {
      latitude,
      longitude,
    };

    // --------------------------------------------------
    // 3. Validate and combine duplicate products
    // --------------------------------------------------
    const combinedItems = new Map();

    for (const item of items) {
      if (
        !item.productId ||
        !mongoose.Types.ObjectId.isValid(item.productId)
      ) {
        res.status(400);
        throw new Error("Invalid product ID");
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        res.status(400);
        throw new Error(
          "Each item requires a positive integer quantity"
        );
      }

      const productId = item.productId.toString();

      if (combinedItems.has(productId)) {
        combinedItems.set(
          productId,
          combinedItems.get(productId) + quantity
        );
      } else {
        combinedItems.set(productId, quantity);
      }
    }

    // --------------------------------------------------
    // 4. Fetch products and use trusted DB prices
    // --------------------------------------------------
    const preparedItems = [];

    for (const [productId, quantity] of combinedItems) {
      const product = await Product.findById(productId);

      if (!product || !product.isActive) {
        res.status(404);
        throw new Error(
          "One or more products are unavailable"
        );
      }

      preparedItems.push({
        productId: product._id,
        quantity,
        price: product.price,
      });
    }

    // --------------------------------------------------
    // 5. Smart branch allocation
    // --------------------------------------------------
    const allocation = await allocateBranch(
      preparedItems,
      validatedLocation
    );

    if (!allocation) {
      res.status(409);
      throw new Error(
        "No branch currently has enough stock to fulfill the entire order"
      );
    }

    const selectedBranch = await Branch.findById(
      allocation.branch._id
    );

    if (!selectedBranch || !selectedBranch.isActive) {
      res.status(409);
      throw new Error(
        "Selected branch is no longer available"
      );
    }

    // --------------------------------------------------
    // 6. Re-check stock before changing quantities
    // --------------------------------------------------
    for (const item of preparedItems) {
      const stockItem = selectedBranch.stock.find(
        (stock) =>
          stock.productId.toString() ===
          item.productId.toString()
      );

      if (
        !stockItem ||
        stockItem.quantity < item.quantity
      ) {
        res.status(409);
        throw new Error(
          "Stock changed during allocation. Please try again."
        );
      }
    }

    // --------------------------------------------------
    // 7. Reserve/decrease stock
    // --------------------------------------------------
    for (const item of preparedItems) {
      const stockItem = selectedBranch.stock.find(
        (stock) =>
          stock.productId.toString() ===
          item.productId.toString()
      );

      stockItem.quantity -= item.quantity;
    }

    selectedBranch.currentWorkload += 1;

    await selectedBranch.save();

    // --------------------------------------------------
    // 8. Create order
    // --------------------------------------------------
    const order = await Order.create({
      customerId: req.user._id,
      items: preparedItems,
      customerLocation: validatedLocation,
      customerMessage:
        typeof customerMessage === "string"
          ? customerMessage.trim()
          : "",
      assignedBranchId: selectedBranch._id,
      allocationScore: Number(
        allocation.score.toFixed(4)
      ),
      allocationReason:
        `Selected based on stock availability, distance ` +
        `(${allocation.distance.toFixed(2)} km), workload ` +
        `(${allocation.workload}), and remaining stock suitability.`,
      status: "ALLOCATED",
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name sku")
      .populate(
        "assignedBranchId",
        "name location"
      );

    res.status(201).json({
      success: true,
      message:
        "Order created and allocated successfully",
      order: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/my
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      customerId: req.user._id,
    })
      .populate("items.productId", "name sku")
      .populate(
        "assignedBranchId",
        "name location"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders - ADMIN
const getAllOrders = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      const validStatuses = [
        "PENDING",
        "ALLOCATED",
        "PROCESSING",
        "COMPLETED",
        "CANCELLED",
      ];

      const status = req.query.status.toUpperCase();

      if (!validStatuses.includes(status)) {
        res.status(400);
        throw new Error("Invalid order status");
      }

      filter.status = status;
    }

    if (req.query.branchId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.query.branchId
        )
      ) {
        res.status(400);
        throw new Error("Invalid branch ID");
      }

      filter.assignedBranchId = req.query.branchId;
    }

    const orders = await Order.find(filter)
      .populate("customerId", "name email")
      .populate("items.productId", "name sku")
      .populate(
        "assignedBranchId",
        "name location"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      res.status(400);
      throw new Error("Invalid order ID");
    }

    const order = await Order.findOne({
      _id: req.params.id,
      customerId: req.user._id,
    });

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (
      !["PENDING", "ALLOCATED"].includes(
        order.status
      )
    ) {
      res.status(400);
      throw new Error(
        "This order can no longer be cancelled"
      );
    }

    if (order.assignedBranchId) {
      const branch = await Branch.findById(
        order.assignedBranchId
      );

      if (branch) {
        for (const item of order.items) {
          const stockItem = branch.stock.find(
            (stock) =>
              stock.productId.toString() ===
              item.productId.toString()
          );

          if (stockItem) {
            stockItem.quantity += item.quantity;
          }
        }

        branch.currentWorkload = Math.max(
          0,
          branch.currentWorkload - 1
        );

        await branch.save();
      }
    }

    order.status = "CANCELLED";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/status - ADMIN
const updateOrderStatus = async (
  req,
  res,
  next
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      res.status(400);
      throw new Error("Invalid order ID");
    }

    const status =
      typeof req.body.status === "string"
        ? req.body.status.toUpperCase()
        : "";

    if (!status) {
      res.status(400);
      throw new Error("Order status is required");
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const allowedTransitions = {
      ALLOCATED: ["PROCESSING", "COMPLETED"],
      PROCESSING: ["COMPLETED"],
    };

    const nextStatuses =
      allowedTransitions[order.status] || [];

    if (!nextStatuses.includes(status)) {
      res.status(400);
      throw new Error(
        `Cannot change order from ${order.status} to ${status}`
      );
    }

    // Completed orders no longer count toward
    // the branch's active workload.
    if (
      status === "COMPLETED" &&
      order.assignedBranchId
    ) {
      const branch = await Branch.findById(
        order.assignedBranchId
      );

      if (branch) {
        branch.currentWorkload = Math.max(
          0,
          branch.currentWorkload - 1
        );

        await branch.save();
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message:
        "Order status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
};