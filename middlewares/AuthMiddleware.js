import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};



//export const verifyToken = (request,response,next) => {
 //   const token =request.cookies.jwt;
  //  if(!token) return response.status(401).send("You are not authenticated")
  //  jwt.verify(token,process.env.JWT_KEY,async(error,payLoad)=>{
   //     if(error) return response.status(403).send("Token is not valid!");
   //     request.userId = payLoad.userId;
  //      next();
//  })
//};