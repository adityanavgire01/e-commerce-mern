const mongoose = require('mongoose');

// Simple Category Schema Definition
const categorySchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    
    description: {
        type: String,
        maxlength: [300, 'Description cannot exceed 300 characters']
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    },

    // Who created this category
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Simple method: Get active categories
categorySchema.statics.getActiveCategories = function() {
    return this.find({ isActive: true }).sort({ name: 1 });
};

// Simple method: Get category with products
categorySchema.methods.getWithProducts = function() {
    return this.populate('products');
};

module.exports = mongoose.model('Category', categorySchema);