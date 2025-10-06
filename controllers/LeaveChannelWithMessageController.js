import Channel from "../models/ChannelModel.js";
import Message from "../models/MessagesModel.js";
import User from "../models/UserModel.js";

export const leaveChannel = async (request, response, next) => {
    try {
        const userId = request.userId;
        const { channelId } = request.params;
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return response.status(404).send("Channel not found");
        }
        // Prevent admin from leaving their own channel
        if (channel.admin.toString() === userId) {
            return response.status(403).send("Admin cannot leave their own channel");
        }
        // Remove user from members array
        channel.members = channel.members.filter(
            (memberId) => memberId.toString() !== userId
        );
        await channel.save();

        // Get user info for message
        const user = await User.findById(userId);
        const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email || 'A user';
        // Create system message
        const leaveMsg = new Message({
            sender: null,
            messageType: "text",
            content: `${displayName} left the channel.`,
        });
        await leaveMsg.save();
        channel.messages.push(leaveMsg._id);
        await channel.save();

        return response.status(200).json({ message: "Left channel successfully" });
    } catch (error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};
