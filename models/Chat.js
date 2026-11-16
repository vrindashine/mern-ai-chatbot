const mongoose = require("mongoose");

const chatschema = new mongoose.Schema({
    userMessage:{
        type:String,
        required:true
    },
    aiResponse:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    sessionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "ChatSession"
   }
});
chatschema.index({ sessionId: 1, createdAt: -1 });
const Chat = mongoose.model("Chat",chatschema)

module.exports = Chat;