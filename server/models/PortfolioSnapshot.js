// models/PortfolioSnapshot.js
const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value:  { type: Number, required: true },
  date:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('PortfolioSnapshot', snapshotSchema);