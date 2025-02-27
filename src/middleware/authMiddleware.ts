import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtHelper";

// interface AuthRequest extends Request{
//     user?:{userId:string;role:string};
// }
export const protect=(req:Request,res:Response,next:NextFunction):void=>{
    const token = req.header('Authorization')?.replace('Bearer ', ''); 
        if(!token){
         res.status(401).json({message:'Unauthorized'})
         return;
    }
    const decoded = verifyToken(token);
    if(!decoded)
    {
        res.status(401).json({message:'token  is not valid '})
        return;
    }
    (req as any).user = decoded;
    next();
};
export const roleProtect=(roles:string[])=>{
    return(req:any, res:Response, next:NextFunction):void=>{
        console.log("User in roleProtect:", req.user); // Debugging

        const user   = req.user;
        if( !user || !roles.includes(user.role)){
             res.status(403).json({message:'You do not have permission to access this resource'})
             return;
        }
        next();
    }
}