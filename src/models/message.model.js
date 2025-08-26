const mongoose = require("mongoose");


const messageSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user"
	},
	chat: {
		type: mongoose.Schema.Types.ObjectId, 
		ref: "chat"
	},
	content: {
		type: String,
		required: true
	},
	role: {
		type: String,    // role means who sent the message
		enum: [ "user", "model", "system" ],   // enum means it can only be one of these values
		default: "user"
	}
}, {
	timestamps: true
})

const messageModel = mongoose.model("message", messageSchema);

module.exports = messageModel;
