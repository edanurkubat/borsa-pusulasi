// server/models/Portfolio.js

const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol:    { type: String, required: true },
  name:      { type: String, required: true },
  type:      { type: String, enum: ['buy', 'sell'], required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true },
  total:     { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trade', TradeSchema);