import multer, { StorageEngine } from 'multer';
import { Request, Response } from 'express';
import fs from "fs"
import path from 'path';

const storage= multer.diskStorage({
  destination: function(req: Request, file: Express.Multer.File, cb){
    const instructorUsername=(req as any).user.username;
    const {courseId}=req.body;
    const uploadPath = path.join(__dirname, `../../uploads/${instructorUsername}/courses/${courseId}`);

    console.log("Upload Path:", uploadPath); 
    if(!fs.existsSync(uploadPath)){
      fs.mkdirSync(uploadPath,{recursive:true});
      console.log("Creating directory:", uploadPath); // Debug log

    }

    cb(null, uploadPath);
  },  
  filename: function (req: Request, file: Express.Multer.File, cb) {
    console.log("📄 Saving File:", file.originalname);
    cb(null,file.originalname)
  },
});

const fileFilter=function (req:Request, File:Express.Multer.File,cb:any){
  const allowedFileTypes=["application/pdf","video/mp4"];
  if(allowedFileTypes.includes(File.mimetype)){
    cb(null,true);
  }else{
    cb(new Error("  Invalid file tye only pdf and video is allowed"))
  }
}
const upload = multer({ storage, fileFilter });

export default upload;