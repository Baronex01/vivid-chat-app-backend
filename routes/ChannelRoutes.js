import {Router} from "express"
import { requireAuth } from "../middlewares/AuthMiddleware.js"
import { createChannel, getChannelMessages, getUserChannels, uploadChannelProfileImage, updateChannelProfileImageUrl, deleteChannel, addChannelMembers } from "../controllers/ChannelController.js";

import { leaveChannel } from "../controllers/LeaveChannelWithMessageController.js";
import { renameChannel } from "../controllers/RenameChannelController.js";


import multer from "multer";


const upload = multer({ dest: "uploads/profiles/" });

const channelRoutes = Router();
channelRoutes.post("/leave/:channelId", requireAuth, leaveChannel);
channelRoutes.post("/:channelId/add-members", requireAuth, addChannelMembers);
// Rename channel (admin only)
channelRoutes.patch("/rename/:channelId", requireAuth, renameChannel);

channelRoutes.delete("/delete/:channelId", requireAuth, deleteChannel);
channelRoutes.post("/upload-profile-image", requireAuth, upload.single("profileImage"), uploadChannelProfileImage);
channelRoutes.post("/update-profile-image-url", requireAuth, updateChannelProfileImageUrl);

channelRoutes.post("/create-channel",requireAuth,createChannel);
channelRoutes.get("/get-user-channels",requireAuth,getUserChannels);
channelRoutes.get("/get-channel-messages/:channelId",requireAuth,getChannelMessages);


export default channelRoutes;