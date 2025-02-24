import mongoose, { Document, Schema } from 'mongoose';
interface IProfile extends Document{
        user: mongoose.Types.ObjectId;
        bio?:string;
        dob?:Date;
        address?:string;
        phone?:string;
        semester?:number;
}
const profileSchema = new mongoose.Schema<IProfile>({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User', unique:true,required:true},
    bio:{type:String, default:""},
    dob:{type:Date, default:null},
    address:{type:String, default:""},  
    phone:{type:String, default:""},
    semester:{type:Number,min:1,max:6,default:null}
},{timestamps:true});

const Profile=mongoose.model<IProfile>('Profile',profileSchema);
export default Profile;