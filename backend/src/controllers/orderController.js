const Product = require("../models/Product");
const Branch = require("../models/Branch");
const Order = require("../models/Order");
const allocateBranch = require("../services/allocationService");

const createOrder = async (req, res, next) => {
  try {
    const { items, customerLocation, customerMessage } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("At least one order item is required");
    }

    if (
      !customerLocation ||
      customerLocation.latitude === undefined ||
      customerLocation.longitude === undefined
    ) {
      res.status(400);
      throw new Error("Customer location is required");
    }

    const preparedItems = [];

    for (const item of items) {
      if (
        !item.productId ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        res.status(400);
        throw new Error(
          "Each item requires a valid product and positive integer quantity"
        );
      }

      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        res.status(404);
        throw new Error("One or more products are unavailable");
      }

      preparedItems.push({
        productId: product._id,
        quantity: Number(item.quantity),
        price: product.price,
      });
    }

    const allocation = await allocateBranch(
      preparedItems,
      customerLocation
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

    // Reduce/reserve stock for the order.
    for (const item of preparedItems) {
      const stockItem = selectedBranch.stock.find(
        (stock) =>
          stock.productId.toString() === item.productId.toString()
      );

      stockItem.quantity -= item.quantity;
    }

    selectedBranch.currentWorkload += 1;

    await selectedBranch.save();

    const order = await Order.create({
      customerId: req.user._id,
      items: preparedItems,
      customerLocation,
      customerMessage: customerMessage || "",
      assignedBranchId: selectedBranch._id,
      allocationScore: Number(allocation.score.toFixed(4)),
      allocationReason:
        `Selected based on stock availability, distance ` +
        `(${allocation.distance.toFixed(2)} km), workload ` +
        `(${allocation.workload}), and remaining stock suitability.`,
      status: "ALLOCATED",
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name sku")
      .populate("assignedBranchId", "name location");

    res.status(201).json({
      success: true,
      message: "Order created and allocated successfully",
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
      .populate("assignedBranchId", "name location")
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
      filter.status = req.query.status.toUpperCase();
    }

    if (req.query.branchId) {
      filter.assignedBranchId = req.query.branchId;
    }

    const orders = await Order.find(filter)
      .populate("customerId", "name email")
      .populate("items.productId", "name sku")
      .populate("assignedBranchId", "name location")
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
    const order = await Order.findOne({
      _id: req.params.id,
      customerId: req.user._id,
    });

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (!["PENDING", "ALLOCATED"].includes(order.status)) {
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
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

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

    // Completed orders are no longer part of branch workload.
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
      message: "Order status updated successfully",
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