import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addPost, updatePost } from "@/service/post";
import { ValidatePostStep } from "../hook/post.form";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../ui/select";

interface Post {
  _id?: string;
  title: string;
  description: string;
  type: string;
  images: (File | string)[];
}

const PostDialog = ({
  isOpen,
  onOpenChange,
  initialData,
  setPostListRefresh,
}) => {
  // const { user } = useAuth();
  const user = JSON.parse(localStorage.getItem("member.user"));
  const { toast } = useToast();

  const [formData, setFormData] = useState<Post>({
    title: "",
    description: "",
    type: "public",
    images: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [isSubmited, setIsSubmited] = useState(false);
  const [errors, setErrors] = useState<any>({})

  const imageRef = useRef<any>(null);
  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (initialData && isOpen) {

     setPreview(
  (initialData?.images || []).map((item) => ({
    url: item,
    type: item.match(/\.(mp4|webm|mov)$/i)
      ? "video"
      : "image",
  }))
);  
      setFormData({
        title: initialData?.title,
        description: initialData?.description,
        type: initialData?.type,
        images: initialData?.images || [initialData?.image],
      });
    } else if (isOpen) {
      setFormData({ title: "", description: "", type: "public", images: [] });
      setPreview(null);
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData({ title: "", description: "", type: "public", images: [] });
    setPreview(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    const newFormData = { ...formData };

    if (files) {
      const fileArray = Array.from(files);

      const updatedImages = [...formData.images, ...fileArray];

      // 🔴 LIMIT CHECK
      if (updatedImages.length > 3) {
        setErrors((prev) => ({
          ...prev,
          images: "Maximum 3 images/videos allowed",
        }));
        return;
      }

      newFormData[name] = updatedImages;

      // 🔵 PREVIEW LOGIC FOR IMAGES + VIDEOS
      const previewUrls = fileArray.map((file: File) => {
        if (file.type.startsWith("video/")) {
          // video file
          return {
            url: URL.createObjectURL(file),
            type: "video",
          };
        } else {
          // image file
          return {
            url: URL.createObjectURL(file),
            type: "image",
          };
        }
      });

      setPreview((prev) => [...(prev || []), ...previewUrls]);
    } else {
      newFormData[name] = value;
    }

    setFormData(newFormData);

    if (isSubmited) {
      const errorData = ValidatePostStep(newFormData);
      setErrors(errorData);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmited(true);

    const errorData = ValidatePostStep(formData);
    setErrors(errorData);
    if (Object?.values(errorData)?.length > 0) return;
    try {
      const obj = {
        ...formData,
        postId: initialData?._id || null,
        userId: user?._id,
      };

      const form = new FormData();

      Object.keys(obj).forEach((k) => {
        const value = obj[k];

        if (k === "images" && Array.isArray(value)) {
          value.forEach((file) => {
            form.append("images", file);
          });
        } else if (value !== undefined && value !== null) {
          form.append(k, value);
        }
      });

      setIsLoading(true);

      const res = await (isEdit ? updatePost(form) : addPost(form));

      if (res.status === 200 || res.status === 201) {
        toast({
          title: isEdit ? "Update Post." : "Create Post.",
          description: res.data.message,
        });

        resetForm();
        setPostListRefresh(true);
        onOpenChange(false);
      }
    } catch (err) {
      toast({
        title: "Post Error.",
        description:
          err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Update Post" : "New Post"}
          </DialogTitle>
          <DialogDescription>
            Create or update your post
          </DialogDescription>
        </DialogHeader>

        <form
          className="p-1 max-h-[500px] overflow-y-auto no-scrollbar"
          onSubmit={handleSubmit}
        >
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input
              type="text"
              name="title"
              value={formData?.title || ""}
              onChange={handleChange}
              placeholder="Enter Title..."
              className={errors?.title ? "border border-red-500" : "border border-input"}
            />
            {errors?.title && <p className="text-xs text-red-500">{errors?.title}</p>}
          </div>

          {/* Description */}
          <div className="my-2" >
            <Label>Description</Label>
            <Textarea
              name="description"
              value={formData?.description || ""}
              onChange={handleChange}
              placeholder="Enter Description..."
              className={errors?.description ? "border border-red-500" : "border border-input"}
            />
            {errors?.description && <p className="text-xs text-red-500">{errors?.description}</p>}
          </div>
          <div className="my-1">
            <Label>Select Type</Label>
            <Select value={formData?.type || "public"} onValueChange={(value) => { setFormData({ ...formData, type: value || "public" }) }} >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image */}
          <div className="flex gap-3 mt-2">
            <div className="flex-1">
              <Label>Image</Label>
              <Input
                name="images"
                ref={imageRef}
                type="file"
                multiple
                onChange={handleChange}
                className={errors?.images ? "border border-red-500" : "border border-input"}
              />
              {errors?.images && <p className="text-xs text-red-500">{errors?.images}</p>}
            </div>

            {/* Preview */}
            <div className="flex-1">
              {preview?.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {preview.map((item, index: number) => {
                    const { url, type } = item;

                    return (
                      <div key={index} className="relative">
                        {type === "image" && (
                          <img
                            src={url}
                            className="w-full h-[70px] object-cover rounded"
                          />
                        )}

                        {type === "video" && (
                          <video
                            src={url}
                            className="w-full h-[70px] object-cover rounded"
                            controls
                          />
                        )}

                        {type === "audio" && (
                          <audio src={url} className="w-full mt-2" controls />
                        )}

                        {/* Remove Button */}
                        <div
                          className="absolute right-0 top-0 text-red-500 bg-white rounded-full w-[18px] h-[18px] flex items-center justify-center cursor-pointer"
                          onClick={() => {
                            const newImages = [...formData.images];
                            newImages.splice(index, 1);

                            const newPreview = [...preview];
                            newPreview.splice(index, 1);

                            setFormData({ ...formData, images: newImages });
                            setPreview(newPreview);

                            if (isSubmited) {
                              const errorData = ValidatePostStep({
                                ...formData,
                                images: newImages,
                              });
                              setErrors(errorData);
                            }
                          }}
                        >
                          <X className="w-[14px] h-[14px]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end mt-4 gap-2">
            <Button
              type="button"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="bg-white text-black border border-gray-200 hover:text-white hover:border-none"
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isEdit
                ? isLoading
                  ? "Updating..."
                  : "Update"
                : isLoading
                  ? "Creating..."
                  : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostDialog;