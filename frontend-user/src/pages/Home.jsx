import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, Clock, Bike } from 'lucide-react';

const categories = [
    { name: 'Fast Food', icon: '/assets/icon_fast_food.png' },
    { name: 'Healthy', icon: '/assets/icon_healthy.png' },
    { name: 'Asian', icon: '/assets/icon_asian.png' },
    { name: 'Desserts', icon: '/assets/icon_dessert.png' }
];

export default function Home() {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <div className="w-full relative overflow-hidden">
            {/* Hero Parallax Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden bg-secondary text-white">
                <motion.div
                    className="absolute inset-0 z-0 parallax-bg"
                    style={{ y: y1, opacity }}
                />
                <div className="absolute inset-0 bg-black/60 z-10" />

                <div className="relative z-20 container mx-auto px-6 text-center pt-20">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="max-w-4xl mx-auto"
                    >
                        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            Savor the Flavor,<br />
                            <span className="text-primary">Without the Wait.</span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-300 mb-10">
                            Discover the best food and drinks in your city, delivered fresh to your door in minutes.
                        </motion.p>

                        <motion.div variants={itemVariants} className="max-w-2xl mx-auto bg-white rounded-full p-2 flex shadow-2xl items-center">
                            <MapPin className="text-gray-400 ml-4 hidden md:block" />
                            <input
                                type="text"
                                placeholder="Enter your delivery address..."
                                className="flex-grow px-4 py-3 bg-transparent text-secondary focus:outline-none"
                            />
                            <button className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2">
                                <Search size={20} />
                                <span>Find Food</span>
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-bold text-secondary mb-2">Explore Categories</h2>
                            <p className="text-gray-500">What are you craving today?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {categories.map((cat, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -10 }}
                                className="bg-[#F9F9F9] rounded-2xl p-6 text-center cursor-pointer transition-shadow hover:shadow-xl border border-gray-100"
                            >
                                <div className="w-24 h-24 mx-auto mb-4 bg-white/50 rounded-full flex items-center justify-center relative shadow-sm">
                                    <img src={cat.icon} alt={cat.name} className="w-20 h-20 object-contain drop-shadow-md" />
                                </div>
                                <h3 className="font-semibold text-lg text-secondary">{cat.name}</h3>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-[#F9F9F9]">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-secondary">How It Works</h2>
                    <p className="text-gray-500 mb-16 max-w-2xl mx-auto text-lg">Your favorite meals are just three simple steps away.</p>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        <div className="hidden md:block absolute top-1/4 left-[16%] w-[68%] h-1 bg-gradient-to-r from-primary/20 to-accent/20 -z-10" />

                        {[
                            { icon: <Search size={40} className="text-primary" />, title: "Choose Your Order", desc: "Browse thousands of menus and find your favorite food." },
                            { icon: <Clock size={40} className="text-accent" />, title: "Wait For Delivery", desc: "Our chefs start preparing your meal instantly." },
                            { icon: <Bike size={40} className="text-primary" />, title: "Enjoy Your Meal", desc: "Food arrives hot and fresh at your door in minutes." }
                        ].map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 border-4 border-[#F9F9F9]">
                                    {step.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                                <p className="text-gray-500">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
