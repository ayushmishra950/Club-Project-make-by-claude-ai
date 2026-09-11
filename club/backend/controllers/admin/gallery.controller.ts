import Gallery from "../../models/gallery.model.js";
import Event from "../../models/event.model.js";
import type { Request, Response } from "express";
import type { MulterRequest } from "../../type/index.js";
import uploadToCloudinary from "../../cloudinary/uploadToCloudinary.js";


export const addGallery = async (req: Request, res: Response) => {
  try {
    const { event } = req.body;

    const files = (req as any).files;
    const galleryImages = files?.image || [];

    if (!event || galleryImages.length === 0) {
      return res.status(400).json({ message: "Event and at least one image are required." });
    }

    const eventDoc = await Event.findById(event);

    if (!eventDoc) {
      return res.status(404).json({ message: "Event not found." });
    }

    const uploadedImages = [];

    for (const file of galleryImages) {
      if (file?.buffer) {

        const imageUrl = await uploadToCloudinary(file.buffer, file.mimetype, "gallery");

        uploadedImages.push(imageUrl);
      }
    }

    const gallery = await Gallery.create({
      event: eventDoc._id,
      image: uploadedImages,
      type: "image",
    });

    // Push Gallery Id Into Event
    if (!eventDoc.gallery.includes(gallery._id)) {
      eventDoc.gallery.push(gallery._id);
    }

    await eventDoc.save();

    // Populate
    const populatedGallery = await Gallery.findById(
      gallery._id
    ).populate("event");

    return res.status(201).json({
      success: true,
      message: "Gallery created successfully.",
      gallery: populatedGallery,
    });

  } catch (err: unknown) {

    console.error(err);

    if (err instanceof Error) {
      return res.status(500).json({
        message: err.message,
      });
    }

    return res.status(500).json({
      message: "Unknown error",
    });
  }
};


export const getAllGallery = async (req: Request, res: Response) => {
  try {
    const { page, perPage, filterCategory } = req.query;

    // pagination setup
    const currentPage = parseInt(page as string) || 1;
    const limit = parseInt(perPage as string) || 10;
    const skip = (currentPage - 1) * limit;

    // filters
    const filters: any = {};

    if (filterCategory && filterCategory !== "all") {
      filters.event = filterCategory;
    }

    const total = await Gallery.countDocuments(filters);

    const galleries = await Gallery.find(filters)
      .populate("event")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Gallery fetched successfully",
      data: galleries,
      pagination: {
        total,
        currentPage,
        perPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Unknown error" });
    }
  }
};

export const updateGallery = async (req: Request, res: Response) => {
  try {
    const { id, event } = req.body;
    const files = (req as any).files;

    if (!id) return res.status(400).json({ message: "Gallery ID is required." });

    if (!event) return res.status(400).json({ message: "Event not found." });

    const existingGallery = await Gallery.findById(id);

    if (!existingGallery) return res.status(404).json({ message: "Gallery not found." });

    const eventDoc = await Event.findById(event);

    if (!eventDoc) return res.status(404).json({ message: "Event not found." });


    let uploadedImages: string[] = [];

    // STEP 1: Handle new uploaded files (MULTIPLE)
    if (files?.image) {
      const fileArray = Array.isArray(files.image) ? files.image : [files.image];

      for (const file of fileArray) {
        if (file?.buffer) {
          const url = await uploadToCloudinary(file.buffer, file.mimetype, "gallery");
          uploadedImages.push(url);
        }
      }
    }

    if (req.body.image) {
      try {
        const parsed = typeof req.body.image === "string" ? JSON.parse(req.body.image) : req.body.image;

        if (Array.isArray(parsed)) {
          uploadedImages = [...uploadedImages, ...parsed];
        }
      } catch {

      }
    }

    if (uploadedImages.length === 0) {
      uploadedImages = existingGallery.image || [];
    }

    const updatedGallery = await Gallery.findByIdAndUpdate(
      id, { event, image: uploadedImages, type: "image", }, { new: true }
    ).populate("event");

    return res.status(200).json({ success: true, message: "Gallery updated successfully", gallery: updatedGallery });

  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({ message: err.message });
    }
    return res.status(500).json({ message: "Unknown error", });
  }
};


export const deleteGallery = async (req: Request, res: Response) => {
  try {
    const galleryId = req.params.id;
    if (!galleryId) return res.status(400).json({ message: "Gallery Id Not found." });

    const gallery = await Gallery.findByIdAndDelete(galleryId);
    if (!gallery) return res.status(404).json({ message: "Gallery not Found." });

    const event = await Event.findById(gallery?.event);
    if (event) {
      event.gallery = event.gallery.filter(
        (id: any) => id.toString() !== gallery._id.toString()
      );
      await event.save();
    }

    res.status(200).json({ message: "Gallery Delete Successfully." })
  }
  catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Unknown error" });
    }
  }
};


export const markAnUnMarkGallery = async (req: Request, res: Response) => {
  try {
    const { galleryId } = req.body;
    if (!galleryId) return res.status(400).json({ message: "GalleryId not Found." });

    const gallery = await Gallery.findById(galleryId);
    if (!gallery) return res.status(404).json({ message: "Gallery Not Found." });

    gallery.important = !gallery?.important;
    await gallery.save();

    res.status(200).json({ message: `This Gallery ${gallery?.important ? "Marked" : "Unmarked"} successfully.` })
  }
  catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Unknown error" });
    }
  }
}