import Event from "../../models/event.model.js";
import User from "../../models/user.model.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import uploadToCloudinary from "../../cloudinary/uploadToCloudinary.js";
import { createNotificationInternal } from "../user/notification.controller.js";
import { NotificationType } from "../../models/notification.model.js";
import { getIO } from "../../utils/socketHelper.js";


export const addEvent = async (req: Request, res: Response) => {
    try {
        const { title, description, date, location, userId, category, type, isPinned } = req.body;
        const io = getIO();
        const files = (req as any).files;
        const coverImages = files?.coverImage || [];

        if (!title || !description || !date || !location || !userId || !category || !type) {
            return res.status(400).json({ message: "title, description, date, location, type and userId field are required." });
        }

        if (!coverImages || coverImages.length === 0) {
            return res.status(400).json({ message: "coverImage is required." });
        }

        let imageUrls: string[] = [];

        for (const file of coverImages) {
            if (file?.buffer) {
                const uploaded = await uploadToCloudinary(file.buffer, file.mimetype, "event-cover");
                if (uploaded) imageUrls.push(uploaded);
            }
        }

        if (imageUrls.length === 0) return res.status(400).json({ message: "coverImage upload failed." });

        const event = await Event.create({
            title,
            description,
            date,
            location,
            createdBy: userId,
            createdAt: new Date(),
            category,
            coverImage: imageUrls,
            type,
            isPinned: isPinned === "true" || isPinned === true ? true : false,
        });

        await createNotificationInternal(userId, userId, NotificationType.EVENT, undefined, `Admin sent a new Event.`);

        const updatedEvent = await Event.findById(event._id).populate("gallery");

        io.emit("event", updatedEvent);

        res.status(201).json({ message: "Event Created Successfully.", data: updatedEvent });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err.message });
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
};

export const getAllEvent = async (req: Request, res: Response) => {
    try {
        const event = await Event.find().populate("gallery").sort({ createdAt: -1 });
        res.status(200).json({ event, success: true })
    }
    catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err?.message, success: false })
        }
        else {
            res.status(500).json({ message: "Server error." })
        }
    }
};


export const getSingleEvent = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.id;
        if (!eventId) return res.status(400).json({ message: "eventId not Found." });

        const event = await Event.findById(eventId).populate("interestedCandidate" , "profileImage");
        if (!event) return res.status(404).json({ message: "event not found." });

        res.status(200).json({ event, success: true })
    }
    catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err?.message });
        }
        else {
            res.status(500).json({ message: "Server error." })
        }
    }
}

export const getLatestEvent = async (req: Request, res: Response) => {
    try {
        let events = await Event.find({ isPinned: true })
            .sort({ createdAt: -1 })
            .populate("gallery")
            .populate("createdBy", "name profileImage");

        if (!events || events.length === 0) {
            const now = new Date();
            events = await Event.find({ date: { $gte: now } })
                .sort({ date: 1 }) // Nearest future first
                .populate("gallery")
                .populate("createdBy", "name profileImage");
        }

        /* An empty calendar is not an error. Returning 404 made every client
           treat "no events yet" as a failed request and show an error where it
           should show nothing. */
        res.status(200).json({ events: events ?? [], success: true });
    }
    catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err?.message, success: false });
        }
        else {
            res.status(500).json({ message: "Server error." });
        }
    }
};


// export const updateEvent = async (req: Request, res: Response) => {
//     try {
//         const { id, title, description, date, location, userId, category, type, coverImage, isPinned } = req.body;
//         const files = (req as any).files;
//         const file = files?.coverImage?.[0];

//         if (!id || !title || !description || !date || !location || !userId || !category || !type) return res.status(400).json({ message: "eventId title, description, date, location, type and userId field are required." });

//         let imageUrl: string = coverImage;

//         if (file && file.buffer) {
//             imageUrl = await uploadToCloudinary(file.buffer, file.mimetype, "coverImage");
//         }

//         const event = await Event.findByIdAndUpdate(id, {
//             title, description, date, type, location,
//             createdBy: userId, category: category,
//             coverImage: imageUrl,
//             isPinned: isPinned === "true" || isPinned === true ? true : false
//         }, { new: true });
//         if (!event) return res.status(404).json({ message: "Event not Found." });

//         res.status(200).json({ message: "Event Update Successfully." })
//     }
//     catch (err: unknown) {
//         if (err instanceof Error) {
//             res.status(500).json({ message: err?.message })
//         }
//         else {
//             res.status(500).json({ message: "Server Error" });
//         }
//     }
// };


export const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id, title, description, date, location, userId, category, type, coverImage, isPinned } = req.body;

        const files = (req as any).files;
        const newFiles = files?.coverImage || [];

        if (!id || !title || !description || !date || !location || !userId || !category || !type) {
            return res.status(400).json({ message: "eventId title, description, date, location, type and userId field are required." });
        }

        let oldImages: string[] = [];

        if (coverImage) {
            if (typeof coverImage === "string") {
                try {
                    oldImages = JSON.parse(coverImage);

                    if (!Array.isArray(oldImages)) { oldImages = [coverImage]; }
                } catch {
                    oldImages = [coverImage];
                }
            }
            else if (Array.isArray(coverImage)) { oldImages = coverImage; }
        }

        let uploadedImages: string[] = [];

        for (const file of newFiles) {
            if (file?.buffer) {
                const uploaded = await uploadToCloudinary(file.buffer, file.mimetype, "coverImage");

                if (uploaded) {
                    uploadedImages.push(uploaded);
                }
            }
        }
        const finalImages = [...oldImages, ...uploadedImages,];

        const event = await Event.findByIdAndUpdate(id,
            {
                title, description, date, type, location, createdBy: userId, category, coverImage: finalImages,
                isPinned: isPinned === "true" || isPinned === true ? true : false,
            },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ message: "Event not Found." });
        }

        res.status(200).json({ message: "Event Updated Successfully.", data: event });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err.message });
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
};



export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.id;
        if (!eventId) return res.status(400).json({ message: "eventId not found." });

        const event = await Event.findByIdAndDelete(eventId);
        if (!event) return res.status(404).json({ message: "Event not found." });

        res.status(200).json({ message: "Event Delete Successfully." })
    }
    catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err?.message })
        }
        else {
            res.status(500).json({ message: "Server error." })
        }
    }
};

export const addAndRemoveCandidateFromEvent = async (req: Request, res: Response) => {
    try {
        const { eventId, userId } = req.body;
        if (!userId || !eventId) return res.status(400).json({ message: "eventId or  userId not Found." });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found." });

        const userObjectId = new mongoose.Types.ObjectId(userId);

        if (event.interestedCandidate.some(id => id.equals(userObjectId))) {
            //  (event.interestedCandidate as mongoose.Types.Array<mongoose.Types.ObjectId>).pull(userObjectId);
            //   y upar wala standerd format hai
            event.interestedCandidate = event.interestedCandidate.filter(
                id => !id.equals(userObjectId)
            );
            // y normal format hai  

            await event.save();
            return res.status(200).json({ message: "User removed from event." });
        } else {
            event.interestedCandidate.push(user._id);
            await event.save();
            return res.status(200).json({ message: "User marked as interested in event." });
        }
    }
    catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err?.message })
        }
        else {
            res.status(500).json({ message: "Server error." })
        }
    }
}