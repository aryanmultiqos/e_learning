import { Request, Response } from 'express'
import User from '../models/user';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwtHelper';
import Profile from '../models/profile';
import mongoose from 'mongoose';
//New User Registartion
export const registerUser = async (req: Request, res: Response) => {
    try {

        const { username, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User email alreday exist" })
            return;
        }
        const newUser = new User({
            username,
            email,
            password,
            role
        });
        await newUser.save();
        if (role === 'student' || role === 'instructor') {
            const profile = new Profile({ user: newUser._id });
            await profile.save();

            newUser.profile = profile._id as mongoose.Types.ObjectId;

        }
        await newUser.save();

        res.status(201).json({ message: 'User register successfully', user: newUser })
    } catch (error: any) {

        if (error.code === 11000) {
            res.status(400).json({ message: 'Username or email  is alreday  taken' })
            return;
        }
        res.status(500).json({ message: 'An error occurred during registration', error: error.message });

    }
}
//login with jwt
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user: any = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: "Invalid email or pass" })
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid Email or Password" })
            return;
        }
        const token = generateToken(user._id.toString(), user.role,user.username);
        res.status(200).json({ message: 'Login Sucess', token, user: { username: user.username, email: user.email, role: user.role } })
    } catch (error: any) {
        res.status(500).json({ message: 'An error ocuuured', error: error.message });
        return;
    }
}
//chnage -password
export const changePass = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmPassword) {
            res.status(400).json({ message: 'Please fill all fields' })
            return;
        }
        if (newPassword !== confirmPassword) {
            res.status(400).json({ message: "New Password and confirm password must match" })
            return;
        }
        if (newPassword.length < 5) {
            res.status(400).json({ message: "password must be off 5 characters" })
            return;
        }
        const user = await User.findById(userId);
        if (!user) {
            res.status(400).json({ message: "User not found" })
            return;
        }
        console.log("Stored Hashed Password Before Update:", user.password);  // Debug line

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "old password is in correct" })
            return;
        }
        if (oldPassword === newPassword) {
            res.status(400).json({ message: "New password cannot be same as old passowrd" })
            return;
        }
     

        user.password = newPassword;
        await user.save();
        console.log("Updated User Password:", user.password);  // Debug line

        res.status(200).json({ message: "Password changed successfully" })
        return;
    } catch (error: any) {
        res.status(500).json({ message: 'An error ocuuured', error: error.message });
    }
};
