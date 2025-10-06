import { Router } from "express";
import { signup, login, updateProfile, getUserInfo, addProfileImage,  removeProfileImage,logout } from "../controllers/AuthController.js";
import { requireAuth } from "../middlewares/AuthMiddleware.js";
import multer from "multer";

const upload = multer({ dest: "uploads/profiles" });

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/userInfo", requireAuth, getUserInfo);
authRoutes.post("/update-profile", requireAuth, upload.single("image"), updateProfile);
authRoutes.post("/add-profile-image", requireAuth, upload.single("profile-image"), addProfileImage);
authRoutes.delete("/remove-profile-image", requireAuth,removeProfileImage);
authRoutes.post("/logout", logout);

export default authRoutes;