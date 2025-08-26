const {Server}  = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../service/ai.service");
const messageModel = require("../models/message.model");

const {createMemory, queryMemory} = require("../service/vector.service");
const { text } = require("express");

function initSocketServer(httpServer){ 
    const io = new Server(httpServer, {}) 

    io.use(async (socket, next) => {

        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        if (!cookies.token) {
            next(new Error("Authentication error: No token provided"));
        }

        try {

            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

            const user = await userModel.findById(decoded.id);

            socket.user = user

            next()

        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }

    })

    io.on("connection", (socket) =>{

        socket.on("ai-message", async (messagePayload) => {    // messagePayload = { chat: chatId, content: "Hello" }
            // Save user message to database
            const message = await messageModel.create({
                user: socket.user._id,
                chat: messagePayload.chat,
                content: messagePayload.content,
                role: "user"
            })

            // generate vector for user message
            const vectors = await aiService.generateVector(messagePayload.content);  
            await createMemory({
                vectors,
                messageId: message._id,
                metadata: {
                    user: socket.user._id,
                    chat: messagePayload.chat,
                    text: messagePayload.content,
                    // role: "user",
                }
            })

            // retrieve relevant context from vector database
            const relevantMemories = await queryMemory({
                queryVector: vectors,
                limit: 1,
                metadata: {
                    // user: socket.user._id,
                    // chat: messagePayload.chat
                }
            })
            console.log("Relevant memories:",relevantMemories);

            // now we have to create short term memory for the ai to generate better response
            const chatHistory = (await messageModel.find({
                 chat: messagePayload.chat 
                }).sort({ createdAt: -1 }).limit(20).lean()).reverse();

                // console.log("Chat history:",chatHistory);
                
            const response = await aiService.generateResponse(chatHistory.map(item=>{
                    return {
                        role: item.role,
                        parts: [{ text: item.content }]
                    }
                }));

            // Save AI response to database
            const responseMessage = await messageModel.create({
                user: socket.user._id,
                chat: messagePayload.chat,
                content: response,
                role: "model"
            })

            // generate vector for ai message
            const responseVectors = await aiService.generateVector(response);  
            await createMemory({
                vectors: responseVectors,
                messageId: responseMessage._id,
                metadata: {
                    user: socket.user._id,
                    chat: messagePayload.chat,
                    text: response,
                    // role: "model",
                }
            })

            socket.emit("ai-response", { 
                content: response,
                chat: messagePayload.chat
            })
    })

})

}

module.exports = initSocketServer;




// 4. Can It Replace Dedicated Vector Databases?

// MongoDB’s vector search is good for general-purpose apps where you want:

// One database for documents + vector search.

// Tight integration with metadata + embeddings.

// But dedicated vector DBs (like Pinecone, Weaviate, Milvus, Qdrant) may still outperform MongoDB in:

// Ultra-large-scale embeddings (billions of vectors).

// Lower-latency, memory-optimized ANN search.

// Specialized vector operations.

// So MongoDB is a hybrid database — excellent when you want vectors + standard queries in one system.