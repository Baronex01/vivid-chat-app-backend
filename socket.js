import {Server as SocketIoServer} from "socket.io"
import Message from "./models/MessagesModel.js"
import Channel from "./models/ChannelModel.js";


const setupSocket = (server) => {
    const io = new SocketIoServer(server,{
        cors:{
            origin:"http://localhost:5173",
            method:["GET","POST"],
            credentials:true,
        },
    });

    const userSocketMap = new Map();
    const onlineUsers = new Set();

    const disconnect = (socket)=>{
        console.log(`Client Disconnected: ${socket.id}`);
        for(const [userId,socketId] of userSocketMap.entries()){
            if(socketId === socket.id){
                userSocketMap.delete(userId);
                onlineUsers.delete(userId);
                io.emit("update-online-users", Array.from(onlineUsers));
                console.log(`User disconnected: ${userId}`);
                break;
            }
        }
    }

    const sendMessage = async (message) => {
        console.log("[sendMessage] called with:", message);
        const senderSocketId = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);
        console.log("[sendMessage] senderSocketId:", senderSocketId, "recipientSocketId:", recipientSocketId);


        let createdMessage;
        try {
            createdMessage = await Message.create(message);
        } catch (err) {
            console.error("[sendMessage] Error saving message to MongoDB:", err);
            return; // Don't proceed if saving failed
        }

        let messageData;
        try {
            messageData = await Message.findById(createdMessage._id)
                .populate("sender", "id email firstName lastName image color")
                .populate("recipient", "id email firstName lastName image color");
        } catch (err) {
            console.error("[sendMessage] Error populating message:", err);
            return;
        }

        if (recipientSocketId) {
            console.log("[sendMessage] Emitting to recipientSocketId");
            io.to(recipientSocketId).emit("receivedMessage", messageData);
        } else {
            console.log("[sendMessage] No recipientSocketId found");
        }

        if (senderSocketId) {
            console.log("[sendMessage] Emitting to senderSocketId");
            io.to(senderSocketId).emit("receivedMessage", messageData);
        } else {
            console.log("[sendMessage] No senderSocketId found");
        }
    };

    const sendChannelMessage = async (message) => {
        const {channelId,sender,content,messageType,fileUrl} = message;

        console.log('[sendChannelMessage] channelId:', channelId);
        const createdMessage = await Message.create({
            sender,
            recipient:null,
            content,
            messageType,
            timestamp:new Date(),
            fileUrl,
        });
        console.log('[sendChannelMessage] createdMessage:', createdMessage);

        const channelUpdate = await Channel.findByIdAndUpdate(channelId,{
            $push:{messages:createdMessage._id}
        }, { new: true });
        console.log('[sendChannelMessage] Channel after update:', channelUpdate);

        const messageData = await Message.findById(createdMessage._id).populate("sender","id email firstName lastName image color").exec();

        const channel = await Channel.findById(channelId).populate("members");
        console.log('[sendChannelMessage] Populated channel:', channel);

        const finalData ={...messageData._doc,channelId:channel._id};

        if(channel && channel.members){
            channel.members.forEach((member)=>{
                const memberSocketId = userSocketMap.get(member._id.toString());
                if(memberSocketId){
                    io.to(memberSocketId).emit("recieve-channel-message",finalData);
                }
            });

            const adminSocketId = userSocketMap.get(channel.admin._id.toString());
            if(adminSocketId){
                io.to(adminSocketId).emit("recieve-channel-message",finalData);
            }
        }
    };

    io.on("connection",(socket)=>{
        console.log("[socket.io] New connection:", socket.id, "userId:", socket.handshake.query.userId);
        const userId = socket.handshake.query.userId;

        if(userId){
            userSocketMap.set(userId,socket.id);
            onlineUsers.add(userId);
            io.emit("update-online-users", Array.from(onlineUsers));
            console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
            console.log("Current userSocketMap:", Array.from(userSocketMap.entries()));
        }else{
            console.log("User ID not provided during connection.")
        }

        socket.on("user-online", (userId) => {
            onlineUsers.add(userId);
            io.emit("update-online-users", Array.from(onlineUsers));
        });

        socket.on("sendMessage", (message) => {
            console.log("[socket.io] sendMessage event received:", message);
            sendMessage(message);
        });
        socket.on("send-channel-message",sendChannelMessage)
        socket.on("disconnect",()=>disconnect(socket))
    })

};



export default setupSocket;