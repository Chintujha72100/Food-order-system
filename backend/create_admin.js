import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb+srv://ithelpdesk:gJwKPgISrv9LO1Kn@cluster0.z57nyx3.mongodb.net/cravebite';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected for Seeding');

    const db = mongoose.connection.useDb('cravebite');
    const User = db.collection('users');

    const adminEmail = 'admin@cravebite.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists!');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      await User.insertOne({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        loginAttempts: 0,
        walletBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Admin user created successfully!');
    }

    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
