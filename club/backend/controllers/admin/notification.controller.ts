import type { Request, Response } from "express";
import Notification, { NotificationType } from "../../models/notification.model.js";
import mongoose from "mongoose";
import { getIO } from "../../utils/socketHelper.js";
import Admin from "../../models/admin.model.js";


export const  getAllNotifications = async(req:Request, res:Response) => {
    try{
       const notifications = await Notification.find()
       .populate("sender", "fullName profileImage")
       .populate("receiver", "fullName profileImage");

       res.status(200).json({data:notifications});

    }
    catch(err:any){
        res.status(500).json({message:err?.mesage});
    }
} 