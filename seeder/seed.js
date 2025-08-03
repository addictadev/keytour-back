require('dotenv').config();
const mongoose = require('mongoose');
const seedPermissions = require('./seedPermissions');

async function runSeeders() {
  try {
    await mongoose.connect('mongodb+srv://adalaapp:123456789ma@cluster0.a93vbj1.mongodb.net/keytour');
    console.log('Connected to MongoDB');

    await seedPermissions();

    console.log('All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
}

runSeeders();