import cloudinary from "./cloudinaryConfig.js";

const uploadToCloudinary = (fileBuffer:Buffer, mimetype:string, folder = "events"):Promise<string> => {

  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("No file buffer provided"));

    // Determine resource type
    let resource_type: "image" | "video" | "raw" = "image"; // default
    if (mimetype.startsWith("video/")) resource_type = "video";
    else if (mimetype.startsWith("audio/")) resource_type = "video"; // Cloudinary me audio ko video resource ke under upload karte hai
    else if (mimetype === "application/pdf") resource_type = "raw"; // PDF ya docs ke liye "raw"

    cloudinary.uploader
      .upload_stream({ folder, resource_type }, (error, result) => {
        if (error) return reject(error);
        if(!result || !result?.secure_url) return(new Error("Upload Failed."))
        resolve(result.secure_url);
      })
      .end(fileBuffer);
  });
};

export default uploadToCloudinary;

