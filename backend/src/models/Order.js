const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    customerLocation: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },

      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },

    customerMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    assignedBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },

    allocationScore: {
      type: Number,
      default: null,
    },

    allocationReason: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ALLOCATED",
        "PROCESSING",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    // AI-generated classification of the customer's message.
    messageCategory: {
      type: String,
      enum: [
        "Payment Issue",
        "Delivery Issue",
        "Refund/Cancellation",
        "Product/Stock Inquiry",
        "Order Status Inquiry",
        "Account/Login Issue",
        "Promotion/Discount Inquiry",
        "General Inquiry",
      ],
      default: undefined,
    },

    // Probability returned by the classifier (0 to 1).
    messageConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    // Indicates predictions that fell below the
    // classifier confidence threshold.
    messageLowConfidence: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Order",
  orderSchema
);