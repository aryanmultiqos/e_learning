import jwt from 'jsonwebtoken';

export const  generateToken=(userId:string, username:string,role:string)=>{
return jwt.sign(
    {userId,username,role},
    process.env.JWT_SECRET as string,
    {expiresIn:'7d'}
);
};

export const verifyToken=(token:string)=>{
    try{
        const decoded =jwt.verify(token, process.env.JWT_SECRET as string);
        console.log("Decoded Token:", decoded); // Debugging
        return decoded;
        // return jwt.verify(token, process.env.JWT_SECRET as string);
    }catch(error){
        return null;
    }
};