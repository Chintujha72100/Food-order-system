import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cravebite');

const importData = async () => {
    try {
        await Product.deleteMany();
        await User.deleteMany();

        const createdUsers = await User.insertMany([
            { name: 'Admin User', email: 'admin@cravebite.com', password: 'password', role: 'admin' },
            { name: 'Test User', email: 'test@cravebite.com', password: 'password', role: 'user' }
        ]);

        const sampleProducts = [
            { name: 'Double Cheeseburger', category: 'Fast Food', price: 299, rating: 4.8, prepTime: '15-20 min', imageUrl: '/assets/cravebite_dish_burger.png' },
            { name: 'Pepperoni & Burrata Pizza', category: 'Fast Food', price: 549, rating: 4.9, prepTime: '20-30 min', imageUrl: '/assets/cravebite_dish_pizza.png' },
            { name: 'Premium Sushi Platter', category: 'Asian', price: 899, rating: 4.7, prepTime: '25-35 min', imageUrl: '/assets/cravebite_dish_sushi.png' },
            { name: 'Chicken Caesar Salad', category: 'Healthy', price: 249, rating: 4.5, prepTime: '10-15 min', imageUrl: '/assets/cravebite_dish_salad.png' },
            { name: 'Truffle Mushroom Pasta', category: 'Healthy', price: 399, rating: 4.8, prepTime: '20-25 min', imageUrl: '/assets/cravebite_dish_pasta.png' },
            { name: 'Authentic Street Tacos', category: 'Fast Food', price: 199, rating: 4.6, prepTime: '10-15 min', imageUrl: '/assets/cravebite_dish_tacos.png' },
            { name: 'Grilled Ribeye Steak', category: 'Healthy', price: 1299, rating: 4.9, prepTime: '30-40 min', imageUrl: '/assets/cravebite_dish_steak.png' },
            { name: 'Buttermilk Pancakes', category: 'Desserts', price: 199, rating: 4.7, prepTime: '15-20 min', imageUrl: '/assets/cravebite_dish_pancakes.png' },
            { name: 'Butter Chicken Curry', category: 'Asian', price: 349, rating: 4.8, prepTime: '20-30 min', imageUrl: '/assets/cravebite_dish_curry.png' },
            { name: 'Decadent Sundae', category: 'Desserts', price: 149, rating: 4.6, prepTime: '5-10 min', imageUrl: '/assets/cravebite_dish_icecream.png' },
            { name: 'Paneer Tikka', category: 'Asian', price: 249, rating: 4.8, prepTime: '20-25 min', imageUrl: '/assets/paneer_tikka.jpg' },
            { name: 'Masala Dosa', category: 'Asian', price: 149, rating: 4.9, prepTime: '15-20 min', imageUrl: '/assets/masala_dosa.jpg' },
            { name: 'Hakka Noodles', category: 'Asian', price: 199, rating: 4.7, prepTime: '15-20 min', imageUrl: '/assets/hakka_noodles.jpg' },
            { name: 'Chocolate Brownie', category: 'Desserts', price: 129, rating: 4.9, prepTime: '10-15 min', imageUrl: '/assets/chocolate_brownie.jpg' }
        ];

        await Product.insertMany(sampleProducts);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
