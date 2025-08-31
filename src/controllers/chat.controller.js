const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');


async function createChat(req, res) {

	const { title } = req.body;
	const user = req.user;

	const chat = await chatModel.create({
		user: user._id,
		title
	});

	res.status(201).json({
		message: "Chat created successfully",
		chat: {
			_id: chat._id,
			title: chat.title,
			lastActivity: chat.lastActivity,
			user: chat.user
		}
	});

}

async function getChats(req, res) {
    const user = req.user;

    const chats = await chatModel.find({ user: user._id });

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats: chats.map(chat => ({
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user
        }))
    });
}

async function getMessages(req, res) {

    const chatId = req.params.id;

    const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages: messages
    })

}

module.exports = {
	createChat,
	getChats,
	getMessages
,
	// Delete a chat and its messages
	async deleteChat(req, res) {
		try {
			const chatId = req.params.id;
			const userId = req.user._id;
			// Find and delete chat owned by user
			const chat = await chatModel.findOneAndDelete({ _id: chatId, user: userId });
			if (!chat) {
				return res.status(404).json({ message: 'Chat not found or not authorized.' });
			}
			// Delete all messages for this chat
			await messageModel.deleteMany({ chat: chatId });
			res.status(200).json({ message: 'Chat deleted successfully.' });
		} catch (err) {
			res.status(500).json({ message: 'Failed to delete chat.' });
		}
	}
};
