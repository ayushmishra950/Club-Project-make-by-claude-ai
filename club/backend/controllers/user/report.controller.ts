import { Request, Response } from "express";
import mongoose from "mongoose";
import Report from "../../models/report.mode.js";



// =====================================
// Create Report (User)
// =====================================

export const createReport = async ( req: Request,res: Response) => {

  try {
    const { reportedBy, reportedUser, reportType, reportedItemId, reason, description } = req.body;

    if (!reportedBy) {
      return res.status(401).json({ success:false, message:"User authentication required" });
    }

    if (!reportType || !reason) {
      return res.status(400).json({ success:false, message:"Report type and reason are required",});
    }
    const report = await Report.create({reportedBy, reportedUser: reportedUser || null, reportType, reportedItemId: reportedItemId || null,reason, description: description || "", status:"pending" });
    return res.status(201).json({ success:true, message:"Report submitted successfully. Admin will review it.", data:report });
  }
  catch(error:any){
    return res.status(500).json({ success:false, message: error.message || "Failed to submit report" });
  }
};


// =====================================
// Get User Own Reports
// =====================================

export const getMyReports = async (req:Request, res:Response) => {
  try {
    const { userId } = req.params;

    if(!userId){
      return res.status(400).json({ success:false, message:"User id required",});}
    const reports = await Report.find({ reportedBy:userId}).sort({ createdAt:-1 });

    return res.status(200).json({ success:true, data:reports });
  }
  catch(error:any){ return res.status(500).json({ success:false, message:error.message });
  }
};

// =====================================
// Admin Get All Reports
// =====================================

export const getAllReports = async (req:Request,res:Response)=>{
try{
const reports = await Report.find().populate("reportedBy","fullName email profileImage").populate("reportedUser","fullName email profileImage").populate("reviewedBy","fullName email").sort({createdAt:-1});

return res.status(200).json({success:true,count:reports.length,data:reports});
}
catch(error:any){
return res.status(500).json({ success:false,message:error.message});
}
};


// =====================================
// Admin Update Report Status / Action
// =====================================

export const updateReportStatus = async (req:Request,res:Response)=>{
try{

const reportId = String(req.params.reportId);

const adminId = String(req.params.adminId);

const {status,actionTaken,adminNote}=req.body;

if(!reportId || !adminId){
return res.status(400).json({ success:false, message:"Report id and admin id required"});}

if(!mongoose.Types.ObjectId.isValid(reportId)){
return res.status(400).json({success:false,message:"Invalid report id"});
}

if(!mongoose.Types.ObjectId.isValid(adminId)){

return res.status(400).json({success:false,message:"Invalid admin id"});}

const report = await Report.findById(reportId);

if(!report){
return res.status(404).json({success:false,message:"Report not found"});
}

if(status){
 report.status=status;
}

if(actionTaken){
 report.actionTaken=actionTaken;
}

if(adminNote){
 report.adminNote=adminNote;
}

report.reviewedBy = new mongoose.Types.ObjectId(adminId);

report.reviewedAt =new Date();
await report.save();
return res.status(200).json({success:true,message:"Report updated successfully",data:report});
}
catch(error:any){
return res.status(500).json({ success:false, message:error.message});
}
};

// =====================================
// Admin Delete Report
// =====================================

export const deleteReport = async (req:Request,res:Response)=>{
try{
const { id } = req.params;
if(!id){
return res.status(400).json({success:false,message:"Report id required"});
}

const report = await Report.findByIdAndDelete(id);
if(!report){
return res.status(404).json({ success:false, message:"Report not found"});
}


return res.status(200).json({success:true,message:"Report deleted successfully"});
}
catch(error:any){
return res.status(500).json({success:false,message:error.message});
}};