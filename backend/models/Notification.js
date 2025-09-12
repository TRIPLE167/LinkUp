const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
 
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",  
      index: true,  
    },
 
    type: {
      type: String,
      required: true,
      enum: ["follow", "message", "like", "comment", "other"], 
    },
  
    text: {
      type: String,
      required: true,
    },
 
    read: {
      type: Boolean,
      default: false,
    },
 
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
 
    sourceId: {
        type: Schema.Types.ObjectId,
        ref: "Dynamic",  
        required: false,  
    }
  },
  { timestamps: true }  
);

 
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
