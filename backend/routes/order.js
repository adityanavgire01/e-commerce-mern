const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders/checkout
// @desc    Create order from cart (checkout)
// @access  Private
router.post('/checkout', [
    authenticateToken,
    body('shippingAddress.fullName')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    body('shippingAddress.address')
        .isLength({ min: 10, max: 200 })
        .withMessage('Address must be between 10 and 200 characters'),
    body('shippingAddress.city')
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters'),
    body('shippingAddress.postalCode')
        .isLength({ min: 4, max: 10 })
        .withMessage('Postal code must be between 4 and 10 characters'),
    body('shippingAddress.country')
        .isLength({ min: 2, max: 50 })
        .withMessage('Country must be between 2 and 50 characters')
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

        // Get user with populated cart
        const user = await User.findById(req.user._id).populate('cart.product');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if cart is empty
        if (user.cart.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Validate cart items and calculate totals
        const orderItems = [];
        let totalItems = 0;
        let totalAmount = 0;

        for (const cartItem of user.cart) {
            const product = cartItem.product;
            
            // Check if product exists and is active
            if (!product || !product.isActive) {
                return res.status(400).json({
                    success: false,
                    message: `Product ${product ? product.name : 'unknown'} is no longer available`
                });
            }

            // Check stock availability
            if (product.quantity < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Only ${product.quantity} available`
                });
            }

            // Calculate item total
            const itemTotal = product.price * cartItem.quantity;
            
            // Add to order items
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                total: itemTotal
            });

            totalItems += cartItem.quantity;
            totalAmount += itemTotal;
        }

        // Generate order number manually as fallback
        const date = new Date();
        const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderNumber = `ORD-${dateString}-${randomString}`;

        // Create order
        const order = new Order({
            orderNumber: orderNumber,
            customer: user._id,
            items: orderItems,
            totalItems,
            totalAmount,
            shippingAddress: req.body.shippingAddress,
            notes: req.body.notes || ''
        });

        // Save order
        await order.save();

        // Reduce inventory for each product
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Clear user's cart
        await user.clearCart();

        // Populate order for response
        await order.populate('items.product', 'name image');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during checkout'
        });
    }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.getOrdersByUser(req.user._id);
        
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private (own order) or Admin
router.put('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order or is admin
        if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own orders'
            });
        }

        // Check if order can be cancelled
        if (!order.canBeCancelled()) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled. Current status: ${order.status}`
            });
        }

        // Update order status to cancelled
        await order.updateStatus('cancelled');

        // Restore inventory
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { quantity: item.quantity } }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while cancelling order'
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private (own order) or Admin
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'firstName lastName email')
            .populate('items.product', 'name image');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns this order or is admin
        if (order.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own orders'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching order'
        });
    }
});

module.exports = router;