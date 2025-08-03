// models/permission.js
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true } // Example: 'create:anything'
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
