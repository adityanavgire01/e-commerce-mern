const mongoose = require('mongoose');

// Simple Product Schema Definition
const productSchema = new mongoose.Schema({
    // Basic Product Information
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    
    description: {
        type: String,
        required: [true, 'Product description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    // Pricing
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },

    // Simple Inventory
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },

    // Category Relationship
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Product category is required']
    },

    // Product Image
    image: {
        type: String,
        default: 'https://via.placeholder.com/300x300?text=No+Image'
    },

    // Product Status
    isActive: {
        type: Boolean,
        default: true
    },

    // Who created this product
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Simple method: Check if product is in stock
productSchema.methods.isInStock = function() {
    return this.quantity > 0;
};

// Simple method: Get public product data
productSchema.methods.getPublicData = function() {
    const productObject = this.toObject();
    return productObject;
};

// Static method: Get active products
productSchema.statics.getActiveProducts = function() {
    return this.find({ isActive: true }).populate('category createdBy', 'name firstName lastName');
};

// Static method: Get products by category
productSchema.statics.getByCategory = function(categoryId) {
    return this.find({ category: categoryId, isActive: true }).populate('category createdBy', 'name firstName lastName');
};

module.exports = mongoose.model('Product', productSchema);