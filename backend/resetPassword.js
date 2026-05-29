import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './models/User.js';

dotenv.config();



const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'testing@gmail.com';
    const newPassword = 'password123'; // Temporary password

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      console.log(`User ${email} not found!`);
      // Optionally create the user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      const newUser = new User({
        name: 'Raghav',
        email: email,
        password: hashedPassword
      });
      await newUser.save();
      console.log(`Created new user ${email} with password: ${newPassword}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      console.log(`Successfully reset password for ${email} to: ${newPassword}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetPassword();
