const Product = require("../models/Product");

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, description, price } = req.body;

    if (!name || !sku || price === undefined) {
      res.status(400);
      throw new Error("Name, SKU and price are required");
    }

    if (Number(price) < 0) {
      res.status(400);
      throw new Error("Price cannot be negative");
    }

    const existingProduct = await Product.findOne({
      sku: sku.trim().toUpperCase(),
    });

    if (existingProduct) {
      res.status(409);
      throw new Error("A product with this SKU already exists");
    }

    const product = await Product.create({
      name,
      sku,
      description,
      price,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { name, sku, description, price, isActive } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (price !== undefined && Number(price) < 0) {
      res.status(400);
      throw new Error("Price cannot be negative");
    }

    if (sku && sku.trim().toUpperCase() !== product.sku) {
      const existingProduct = await Product.findOne({
        sku: sku.trim().toUpperCase(),
      });

      if (existingProduct) {
        res.status(409);
        throw new Error("A product with this SKU already exists");
      }
    }

    if (name !== undefined) product.name = name;
    if (sku !== undefined) product.sku = sku;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (isActive !== undefined) product.isActive = isActive;

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
};   