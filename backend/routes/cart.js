const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Get user with populated cart
        const user = await User.findById(req.user._id)
            .populate('cart.product', 'name description price image isActive quantity');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Filter out inactive products from cart
        const activeCartItems = user.cart.filter(item => item.product && item.product.isActive);

        // Calculate cart totals
        let totalItems = 0;
        let totalPrice = 0;

        activeCartItems.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.product.price * item.quantity;
        });

        res.status(200).json({
            success: true,
            data: {
                items: activeCartItems,
                summary: {
                    totalItems,
                    totalPrice: parseFloat(totalPrice.toFixed(2))
                }
            }
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching cart'
        });
    }
});

// @route   POST /api/cart/add/:productId
// @desc    Add item to cart
// @access  Private
router.post('/add/:productId', [
    authenticateToken,
    body('quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer')
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

        const { productId } = req.params;
        const { quantity = 1 } = req.body;

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available'
            });
        }

        // Check if enough stock is available
        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.quantity} items available in stock`
            });
        }

        // Get user and check current cart quantity
        const user = await User.findById(req.user._id);
        const existingItem = user.cart.find(item => item.product.toString() === productId);
        const currentQuantity = existingItem ? existingItem.quantity : 0;

        // Check if total quantity (current + new) exceeds stock
        if (currentQuantity + quantity > product.quantity) {
            return res.status(400).json({
                success: false,
                message: `Cannot add ${quantity} items. Only ${product.quantity - currentQuantity} more available`
            });
        }

        // Add to cart
        await user.addToCart(productId, quantity);

        res.status(200).json({
            success: true,
            message: `Added ${quantity} ${product.name}(s) to cart`,
            data: {
                productId,
                productName: product.name,
                quantity,
                totalInCart: currentQuantity + quantity
            }
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding to cart'
        });
    }
});

// @route   PUT /api/cart/update/:productId
// @desc    Update item quantity in cart
// @access  Private
router.put('/update/:productId', [
    authenticateToken,
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer')
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

        const { productId } = req.params;
        const { quantity } = req.body;

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available'
            });
        }

        // Check if enough stock is available
        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.quantity} items available in stock`
            });
        }

        // Update cart quantity
        const user = await User.findById(req.user._id);
        await user.updateCartQuantity(productId, quantity);

        res.status(200).json({
            success: true,
            message: `Updated ${product.name} quantity to ${quantity}`,
            data: {
                productId,
                productName: product.name,
                newQuantity: quantity
            }
        });

    } catch (error) {
        if (error.message === 'Item not found in cart') {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating cart'
        });
    }
});

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;

        // Get user and check if item exists in cart
        const user = await User.findById(req.user._id);
        const existingItem = user.cart.find(item => item.product.toString() === productId);

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Remove from cart
        await user.removeFromCart(productId);

        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: {
                productId,
                removedQuantity: existingItem.quantity
            }
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while removing from cart'
        });
    }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const itemCount = user.getCartItemCount();

        await user.clearCart();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                removedItems: itemCount
            }
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while clearing cart'
        });
    }
});

module.exports = router;