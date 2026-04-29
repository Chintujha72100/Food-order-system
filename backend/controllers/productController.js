import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
    try {
        const keyword = req.query.keyword ? { name: { $regex: req.query.keyword, $options: 'i' } } : {};
        const category = req.query.category && req.query.category !== 'All' ? { category: req.query.category } : {};

        // Add minPrice and maxPrice handling
        let priceFilter = {};
        if (req.query.minPrice || req.query.maxPrice) {
            priceFilter.price = {};
            if (req.query.minPrice) priceFilter.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) priceFilter.price.$lte = Number(req.query.maxPrice);
        }

        const products = await Product.find({ ...keyword, ...category, ...priceFilter });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await Product.deleteOne({ _id: product._id });
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = req.body.name || product.name;
            product.price = req.body.price || product.price;
            product.category = req.body.category || product.category;
            product.imageUrl = req.body.imageUrl || product.imageUrl;
            product.inStock = req.body.inStock !== undefined ? req.body.inStock : product.inStock;
            product.gstRate = req.body.gstRate !== undefined ? req.body.gstRate : product.gstRate;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createProductReview = async (req, res) => {
    const { rating, comment } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            product.reviews.push(review);
            product.numReviews = product.reviews.length;
            product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteProductReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const reviewIndex = product.reviews.findIndex(
                (r) => r._id.toString() === req.params.reviewId.toString()
            );

            if (reviewIndex === -1) {
                return res.status(404).json({ message: 'Review not found' });
            }

            product.reviews.splice(reviewIndex, 1);

            product.numReviews = product.reviews.length;
            product.rating = product.reviews.length > 0
                ? product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
                : 0;

            await product.save();
            res.json({ message: 'Review removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
