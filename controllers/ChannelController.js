// Add members to an existing channel
export const addChannelMembers = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { newMembers } = req.body; // array of user IDs
        if (!Array.isArray(newMembers) || newMembers.length === 0) {
            return res.status(400).json({ error: "No new members provided" });
        }
        // Validate users
        const validMembers = await User.find({ _id: { $in: newMembers } });
        if (validMembers.length !== newMembers.length) {
            return res.status(400).json({ error: "Some members are not valid users" });
        }
        // Update channel: add new members, avoid duplicates
        const updatedChannel = await Channel.findByIdAndUpdate(
            channelId,
            { $addToSet: { members: { $each: newMembers } } },
            { new: true }
        ).populate('members', 'firstName lastName email image color');
        if (!updatedChannel) {
            return res.status(404).json({ error: "Channel not found" });
        }
        return res.status(200).json({ channel: updatedChannel });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
import { mkdirSync, renameSync } from "fs";
import mongoose from "mongoose";
import Channel from "../models/ChannelModel.js";
import User from "../models/UserModel.js";



// Leave a channel (for members, not admin)
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
        return response.status(200).json({ message: "Left channel successfully" });
    } catch (error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};
// Delete a channel by ID (only admin can delete)
// In ChannelController.js
export const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id; // assuming you use authentication middleware

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    if (String(channel.admin) !== String(userId)) {
      return res.status(403).json({ error: "Only admin can delete the channel" });
    }

    await Channel.findByIdAndDelete(channelId);
    res.status(200).json({ message: "Channel deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Upload or update channel profile image
export const uploadChannelProfileImage = async (request, response, next) => {
    try {
        if (!request.file) {
            return response.status(400).send("File is required");
        }
        const channelId = request.body.channelId;
        if (!channelId) {
            return response.status(400).send("Channel ID is required");
        }
        const date = Date.now();
        let fileDir = `uploads/profiles/${date}`;
        let fileName = `${fileDir}/${request.file.originalname}`;
        mkdirSync(fileDir, { recursive: true });
        renameSync(request.file.path, fileName);
        // Update channel with new profile image path
        const updatedChannel = await Channel.findByIdAndUpdate(
            channelId,
            { profileImage: fileName },
            { new: true }
        );
        if (!updatedChannel) {
            return response.status(404).send("Channel not found");
        }
        return response.status(200).json({ profileImage: fileName, channel: updatedChannel });
    } catch (error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};

// Update channel profile image by URL (optional, for direct URL update)
export const updateChannelProfileImageUrl = async (request, response, next) => {
    try {
        const { channelId, profileImage } = request.body;
        if (!channelId || !profileImage) {
            return response.status(400).send("Channel ID and profileImage are required");
        }
        const updatedChannel = await Channel.findByIdAndUpdate(
            channelId,
            { profileImage },
            { new: true }
        );
        if (!updatedChannel) {
            return response.status(404).send("Channel not found");
        }
        return response.status(200).json({ profileImage, channel: updatedChannel });
    } catch (error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};
export const createChannel = async (request,response,next) =>{
    try {
     const {name,members} = request.body;

     const userId = request.userId;

     const admin = await User.findById(userId);

     if(!admin){
        return response.status(400).send("Admin user not found.")
     }

     const validMembers = await User.find({_id:{$in:members}});

     if(validMembers.length !== members.length){
        return response.status(400).send("Some members are not valide users")
     };

     const newChannel = new Channel({
        name,members,admin:userId
     });

    await newChannel.save();
    return response.status(201).json({channel: newChannel});

    } catch(error) {
    console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getUserChannels = async (request,response,next) =>{
    try {
     const userId = new mongoose.Types.ObjectId(request.userId);

     const channels = await Channel.find({
        $or:[{admin:userId},{members:userId}],
     }).sort({updatedAt:-1});

     

     
     return response.status(201).json({channels});

    } catch(error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};


export const getChannelMessages = async (request, response, next) => {
    try {
        const { channelId } = request.params;
            const channel = await Channel.findById(channelId)
                .populate({
                    path: "messages",
                    options: { sort: { timestamp: 1 } },
                    populate: {
                        path: "sender",
                        select: "firstName lastName email _id image color"
                    }
                });

        if (!channel) {
            return response.status(404).send("Channel not found");
        }

        const messages = Array.isArray(channel.messages) ? channel.messages : [];
        return response.status(200).json({ messages });
    } catch (error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};