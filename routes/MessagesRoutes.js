import { Router } from "express";
import { getMessages, uploadFile } from "../controllers/MessagesController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import multer from "multer"

const messagesRoutes = Router();

const upload = multer({dest:"uploads/files"})

messagesRoutes.post('/getMessages', requireAuth, getMessages);
messagesRoutes.post('/upload-file', requireAuth, upload.single("file"),uploadFile);



export default messagesRoutes;