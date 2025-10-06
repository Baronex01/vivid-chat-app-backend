import Channel from "../models/ChannelModel.js";
import User from "../models/UserModel.js";
import mongoose from "mongoose";

export const renameChannel = async (req, res) => {
  try {
    const userId = req.userId;
    const { channelId } = req.params;
    const { name } = req.body;
    if (!name || !channelId) {
      return res.status(400).json({ message: "Channel ID and new name are required." });
    }
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found." });
    }
    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only the channel admin can rename this channel." });
    }
    channel.name = name;
    await channel.save();
    return res.status(200).json({ message: "Channel renamed successfully.", channel });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
