// models/DataObject.js
const mongoose = require("mongoose");

const dataObjectSchema = new mongoose.Schema({
  id: String,
  state: String,
  motion: Boolean,
  time: Date,
  dim: Number,
  naturalLight: Number,
});

const DataObject = mongoose.model("DataObject", dataObjectSchema);

module.exports = DataObject;
