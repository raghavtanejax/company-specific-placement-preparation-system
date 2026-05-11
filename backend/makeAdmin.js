import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const makeAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();
    console.log(`Successfully made ${email} an admin!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

const emailArg = process.argv[2];
if (!emailArg) {
  console.log('Please provide an email address: node makeAdmin.js <user-email>');
  process.exit(1);
}

makeAdmin(emailArg);
