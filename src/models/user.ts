import mongoose, { Document , Types} from "mongoose";
import bcrypt from 'bcryptjs';

interface IUser extends Document {
    username: string;
    email: String
    password: string
    role: 'student' | 'instructor' | 'admin';
    profile?: mongoose.Types.ObjectId | null; 
    isVerified:number;
}

const userSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,  
        minlength: [5, 'Username must be at least 3 characters long'],  
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,  
        match: [/\S+@\S+\.\S+/, 'Email must be a valid email address'],  // Regex for email validation
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [5, 'Password must be at least 5 characters long'],
      },
      role:{
        type: String,
        enum: ['student', 'instructor', 'admin'],
        required:[true,'Role is required']
      },
      profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },  // 1-to-1 Relationship
      isVerified:{type:Number,default:0},
}, { timestamps: true });
userSchema.pre('save', async function(next){
    if(!this.isModified('password'))
        return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model<IUser>('User',userSchema);
export default User;