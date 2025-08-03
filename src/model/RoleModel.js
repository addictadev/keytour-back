// models/role.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Example: 'Admin'
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }] // References to Permission model
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
