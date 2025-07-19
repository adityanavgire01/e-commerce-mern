const mongoose = require('mongoose');

// Order Schema Definition
const orderSchema = new mongoose.Schema({
    // Order Identification
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },

    // Customer Information
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Order Items (from cart)
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    // Order Summary
    totalItems: {
        type: Number,
        required: true,
        min: 0
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // Order Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },

    // Shipping Information
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },

    // Order Notes
    notes: {
        type: String,
        default: ''
    },

    // Timestamps for order tracking
    orderDate: {
        type: Date,
        default: Date.now
    },

    deliveryDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
    if (!this.orderNumber) {
        // Generate order number: ORD-YYYYMMDD-RANDOM
        const date = new Date();
        const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.orderNumber = `ORD-${dateString}-${randomString}`;
    }
    next();
});

// Static method: Get orders by user
orderSchema.statics.getOrdersByUser = function(userId) {
    return this.find({ customer: userId })
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 });
};

// Static method: Get recent orders (admin)
orderSchema.statics.getRecentOrders = function(limit = 10) {
    return this.find()
        .populate('customer', 'firstName lastName email')
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Instance method: Update order status
orderSchema.methods.updateStatus = function(newStatus) {
    this.status = newStatus;
    
    // Set delivery date if status is delivered
    if (newStatus === 'delivered') {
        this.deliveryDate = new Date();
    }
    
    return this.save();
};

// Instance method: Get order summary
orderSchema.methods.getOrderSummary = function() {
    return {
        orderNumber: this.orderNumber,
        totalItems: this.totalItems,
        totalAmount: this.totalAmount,
        status: this.status,
        orderDate: this.orderDate,
        deliveryDate: this.deliveryDate
    };
};

// Instance method: Check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
    return ['pending', 'processing'].includes(this.status);
};

module.exports = mongoose.model('Order', orderSchema);