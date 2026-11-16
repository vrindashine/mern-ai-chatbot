const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "New chat"
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatSession = mongoose.model(
  "ChatSession",
  chatSessionSchema
);

module.exports = ChatSession;
