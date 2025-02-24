import{Request,Response}from 'express'
import User from '../models/user';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwtHelper';
import Profile from '../models/profile';
import mongoose from 'mongoose';
//New User Registartion
export const registerUser=async(req:Request,res:Response)=>{
    try{
       
        const{username,email,password,role}=req.body;
        const existingUser=await User.findOne({email});
        if(existingUser){
            res.status(400).json({message:"User email alreday exist"})
            return;
        }
        const newUser = new User({
            username,
            email,
            password,
            role
        });
        await newUser.save();
        if (role === 'student' || role === 'instructor' ) {
            const profile = new Profile({ user: newUser._id});
            await profile.save();

            newUser.profile = profile._id as mongoose.Types.ObjectId;
           
        }
        await newUser.save();
      
         res.status(201).json({message:'User register successfully',user:newUser})
    }catch(error: any){
     
        if(error.code===11000){ 
            res.status(400).json({message:'Username or email  is alreday  taken'})
            return;
        }
        res.status(500).json({ message: 'An error occurred during registration', error: error.message });

    }
}
//login with jwt
export const loginUser=async(req:Request,res:Response)=>{
    const {email,password}=req.body;
    try{
        const user : any = await User.findOne({email});
        if(!user){
            res.status(400).json({message:"Invalid email or pass"}) 
        }
        const isMatch= await bcrypt.compare(password, user.password);
        if(!isMatch){
            res.status(400).json({message:"Invalid Email or Password"})
            return;
        }
        const token = generateToken(user._id.toString(),user.role);
        res.status(200).json({message:'Login Sucess',token,user:{username:user.username,email:user.email,role:user.role}})
    }catch(error:any){
        res.status(500).json({message:'An error ocuuured',error:error.message});
    }
}   
