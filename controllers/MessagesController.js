import Message from '../models/MessagesModel.js'
import {mkdirSync, rename, renameSync} from "fs"
import { sanitizeFilename } from "../utils/file-utils.js";

export const getMessages = async (request, response, next) => {
  try {
    const user1 = request.userId;
      const user2 = request.body.id;
      console.log("[getMessages called] user1:", user1, "user2:", user2);

    if (!user1 || !user2) {
      return response.status(400).send("Both user IDs are required.");
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 }, // <-- fix here
        { sender: user2, recipient: user1 }
      ]
    }).sort({ timestamp: 1 });

    return response.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    return response.status(500).send("Internal Server Error");
  }
};




export const uploadFile = async (request, response, next) => {
  try {
    
    if(!request.file){
      return response.status(400).send("File is required");
    }
    
const date = Date.now();
let fileDir =`uploads/files/${date}`
const original = request.file.originalname || 'upload';
const safeName = sanitizeFilename(original);
let fileName =`${fileDir}/${safeName}`

mkdirSync(fileDir,{recursive:true});

renameSync(request.file.path, fileName);


    return response.status(200).json({ filePath:fileName });
  } catch (error) {
    console.error(error);
    return response.status(500).send("Internal Server Error");
  }
};