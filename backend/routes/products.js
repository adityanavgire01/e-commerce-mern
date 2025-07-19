const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all active products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const products = await Product.getActiveProducts();
        
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching products'
        });
    }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private + Admin
router.post('/', [
    authenticateToken,
    requireAdmin,
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Product name must be between 2 and 100 characters'),
    body('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    body('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Price cannot be negative'),
    body('quantity')
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer'),
    body('category')
        .isMongoId()
        .withMessage('Please provide a valid category ID')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, description, price, quantity, category, image } = req.body;

        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Create new product
        const product = new Product({
            name,
            description,
            price,
            quantity,
            category,
            image,
            createdBy: req.user._id
        });

        await product.save();

        // Populate category and creator info
        await product.populate('category createdBy', 'name firstName lastName');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating product'
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category createdBy', 'name firstName lastName');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching product'
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private + Admin
router.put('/:id', [
    authenticateToken,
    requireAdmin,
    body('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Product name must be between 2 and 100 characters'),
    body('description')
        .optional()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    body('price')
        .optional()
        .isNumeric()
        .withMessage('Price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Price cannot be negative'),
    body('quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer'),
    body('category')
        .optional()
        .isMongoId()
        .withMessage('Please provide a valid category ID')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, description, price, quantity, category, image, isActive } = req.body;

        // Check if product exists
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if category exists (if provided)
        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Category not found'
                });
            }
        }

        // Update product fields
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (description !== undefined) updateFields.description = description;
        if (price !== undefined) updateFields.price = price;
        if (quantity !== undefined) updateFields.quantity = quantity;
        if (category !== undefined) updateFields.category = category;
        if (image !== undefined) updateFields.image = image;
        if (isActive !== undefined) updateFields.isActive = isActive;

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('category', 'name');

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating product'
        });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private + Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete the product
        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting product'
        });
    }
});

module.exports = router;