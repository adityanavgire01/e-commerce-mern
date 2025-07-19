const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema Definition
const userSchema = new mongoose.Schema({
    // Basic Information
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ]
    },
    
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    
    // User Profile
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    
    // User Role
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    
    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Profile Picture (optional)
    avatar: {
        type: String,
        default: null
    },

    // Shopping Cart
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    // Add timestamps (createdAt, updatedAt)
    timestamps: true
});


// Pre-save middleware: Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method: Compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method : Get user data without sensitive information
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

// Static method: Find user by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Cart Methods
// Add item to cart
userSchema.methods.addToCart = function(productId, quantity = 1) {
    const existingItem = this.cart.find(item => item.product.toString() === productId.toString());
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        this.cart.push({
            product: productId,
            quantity: quantity
        });
    }
    
    return this.save();
};

// Remove item from cart
userSchema.methods.removeFromCart = function(productId) {
    this.cart = this.cart.filter(item => item.product.toString() !== productId.toString());
    return this.save();
};

// Update item quantity in cart
userSchema.methods.updateCartQuantity = function(productId, quantity) {
    const item = this.cart.find(item => item.product.toString() === productId.toString());
    
    if (item) {
        if (quantity <= 0) {
            return this.removeFromCart(productId);
        }
        item.quantity = quantity;
        return this.save();
    }
    
    throw new Error('Item not found in cart');
};

// Clear entire cart
userSchema.methods.clearCart = function() {
    this.cart = [];
    return this.save();
};

// Get cart total (items count)
userSchema.methods.getCartItemCount = function() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
};

module.exports = mongoose.model('User', userSchema);


