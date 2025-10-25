import User from "../models/UserModel.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";
import { renameSync,unlinkSync } from "fs";
import { sanitizeFilename } from "../utils/file-utils.js";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
    return jwt.sign({ email, userId }, process.env.JWT_KEY, { expiresIn: maxAge });
}

export const signup = async (request,response,next) =>{
    try {
        const {email,password}=request.body;
        if (!email || !password) {
            return response.status(400).send("Email and Password is required")
        }
        const user = await User.create({email,password});
        // Set cookie including the new Partitioned attribute to avoid
        // cross-site cookie rejections in modern browsers.
        // Partitioned is experimental — if the browser doesn't support it
        // it will ignore the attribute. We build the Set-Cookie header
        // manually so we can include it.
        try {
            const token = createToken(email,user.id);
            const maxAgeSeconds = Math.floor(maxAge / 1000);
            const cookieStr = `jwt=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=None; Partitioned`;
            // Append so we don't clobber any other Set-Cookie headers
            response.append('Set-Cookie', cookieStr);
        } catch (e) {
            // fallback to express cookie (older behavior)
            response.cookie("jwt",createToken(email,user.id),{
                maxAge,
                secure:true,
                sameSite:"None",
            });
        }
        return response.status(201).json({user:{
            id:user.id,
            email:user.email,
            profileSetup:user.profileSetup
        }})
    } catch(error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
}

export const login = async (request,response,next) =>{
    try {
        const {email,password}=request.body;
        if (process.env.NODE_ENV !== 'production') {
            try { console.log(`[auth] login attempt for email=${String(email).slice(0,100)}`); } catch(e){}
        }
        if (!email || !password) {
            return response.status(400).send("Email and Password is required")
        }
        const user = await User.findOne({email});
        if(!user){
            if (process.env.NODE_ENV !== 'production') console.log('[auth] user not found for email=', email);
            return response.status(404).send("User with the given email not found.")
        }
        const auth = await bcrypt.compare(password,user.password);
        if(!auth){
             if (process.env.NODE_ENV !== 'production') console.log('[auth] password mismatch for user=', user.email);
             return response.status(400).send("Password is incorrect.")
        }

        try {
            const token = createToken(email,user.id);
            const maxAgeSeconds = Math.floor(maxAge / 1000);
            const cookieStr = `jwt=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=None; Partitioned`;
            response.append('Set-Cookie', cookieStr);
        } catch (e) {
            response.cookie("jwt",createToken(email,user.id),{
                maxAge,
                secure:true,
                sameSite:"None",
            });
        }
        return response.status(200).json({user:{
            id:user.id,
            email:user.email,
            profileSetup:user.profileSetup,
            firstName:user.firstName,
            lastName:user.lastName,
            image:user.image,
            color:user.color,
        }})
    } catch(error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getUserInfo = async (request,response,next) =>{
    try {
     const userData = await User.findById(request.userId);
     if(!userData) {
        return response.status(404).send("User with the given id not found.")
     }

        return response.status(200).json({
            id:userData.id,
            email:userData.email,
            profileSetup:userData.profileSetup,
            firstName:userData.firstName,
            lastName:userData.lastName,
            image:userData.image,
            color:userData.color,
       });
    } catch(error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};




export const updateProfile = async (request, response, next) => {
  try {
    const { userId } = request;
    const { firstName, lastName, color } = request.body;
    let image = request.body.image;

    // If a file was uploaded, use its path
    if (request.file) {
      image = request.file.path;
    }

    if (!firstName || !lastName) {
      return response.status(400).send("FirstName and lastName are required.");
    }

    const userData = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, image, color, profileSetup: true },
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).send("Internal Server Error");
  }
};


export const addProfileImage = async (request,response,next) =>{
        try {
            if(!request.file) {
                return response.status(400).send("Image is required");

            }


            const date = Date.now();
            const original = request.file.originalname || 'upload';
            const safeName = sanitizeFilename(original);
            let fileName = `uploads/profiles/${date}-${safeName}`;
            renameSync(request.file.path, fileName);

            // Store only the relative path in the database
            const updatedUser = await User.findByIdAndUpdate(request.userId, { image: fileName }, { new: true, runValidators: true });

            return response.status(200).json({
                image: updatedUser.image,
            });
        } catch (error) {
            console.error(error);
            return response.status(500).send("Internal Server Error");
        }
};


export const removeProfileImage = async (request,response,next) =>{
    try {
     
       const {userId} = request;
       const user = await User.findById(userId);

        if(!user){
            return response.status(400).send("User not found.")
        }

        if (user.image) {
            let imagePath = user.image;
            if (imagePath.startsWith('http')) {
                imagePath = imagePath.replace(/^https?:\/\/[^\/]+\//, '');
            }
            try {
                unlinkSync(imagePath);
            } catch (err) {
                console.warn('File not found for deletion:', imagePath);
            }
        }
        user.image = null;
        await user.save();
    

    
        return response.status(200).send("Profile image removed successfully.")
    } catch(error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};


export const logout = async (request,response,next) =>{
    try {
     

        try {
            // expire the cookie and include Partitioned attribute for consistency
            const cookieStr = `jwt=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`;
            response.append('Set-Cookie', cookieStr);
        } catch (e) {
            response.cookie("jwt","",{maxAge:1,secure:true,sameSite:"None"})
        }
        return response.status(200).send("Logout successfull.")
    } catch(error) {
        console.error(error);
        return response.status(500).send("Internal Server Error");
    }
};


