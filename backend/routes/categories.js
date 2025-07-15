const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all active categories
// @access  Public
router.get('/', async (req, res) => {
    try {
        const categories = await Category.getActiveCategories();
        
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching categories'
        });
    }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private + Admin
router.post('/', [
    authenticateToken,
    requireAdmin,
    body('name')
        .isLength({ min: 2, max: 50 })
        .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
        .optional()
        .isLength({ max: 300 })
        .withMessage('Description cannot exceed 300 characters')
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

        const { name, description } = req.body;

        // Create new category
        const category = new Category({
            name,
            description,
            createdBy: req.user._id
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });

    } catch (error) {
        // Handle duplicate category name
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating category'
        });
    }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching category'
        });
    }
});

module.exports = router;