import fs from "fs";

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import AuthRoutes from "./routes/AuthRoutes.js";
import ContactRoutes from "./routes/ContactRoutes.js";
import setupSocket from "./socket.js";
import messagesRoutes from "./routes/MessagesRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";



dotenv.config();

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const app = express();
const port = process.env.PORT ||  5050;
const databaseURL = process.env.ATLAS_URL;


const allowedOrigins = [
    'http://localhost:5173', // Local development
    'https://my-chat-app.o2v9.onrender.com' // Production URL
];

app.use(cors({
    origin: (origin, callback) => {
        console.log('CORS Origin:', origin); // Log the origin of the request
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
}));

// Handle preflight requests
app.options('*', cors()); // Enable pre-flight across-the-board


app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files",express.static("uploads/files"));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Root route for Render and browser
app.get('/', (req, res) => {
  res.send('API is running');
});

// Mount AuthRoutes only once
app.use("/api/auth", AuthRoutes);
app.use("/api/contacts", ContactRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes);


// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const server =  app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


setupSocket(server)


// Connect to MongoDB first, then start the server
mongoose.connect(process.env.ATLAS_URL, { /* options */ })
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.error("DB Connection Error:", err));