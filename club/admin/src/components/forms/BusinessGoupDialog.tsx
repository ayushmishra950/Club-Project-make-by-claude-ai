import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createBusinessGroup, updateBusinessGroup } from "@/service/businessGroup";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../ui/select";
import { validateBusinessGroupForm } from "../hook/businessGroup.form";

const BusinessGroupDialog = ({
  isOpen,
  onOpenChange,
  initialData,
  setGroupListRefresh,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ title: "", description: "", files: [], type: "public", location: "", category: ""});
  const [errors, setErrors] = useState<any>({});
   const [isSubmitted, setIsSubmitted] = useState(false);
  const [previewList, setPreviewList] = useState<
    { url: string; type: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const isEdit = Boolean(initialData);
  const fileRef = useRef<HTMLInputElement>(null);

  // 🔁 Edit Mode
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        files: [],
        type: initialData?.type || "public",
        location: initialData?.location || "",
        category: initialData?.category || "",
      });

      // existing preview
      const existing =
        initialData?.images?.map((url: string) => ({
          url,
          type: url.endsWith(".mp4") ? "video" : "image",
        })) || [];

      setPreviewList(existing);
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setFormData({ title: "", description: "", files: [], type: "public", location: "", category: "" });
    setPreviewList([]);
  };

  // 📁 Handle file change (image + video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 0) {
      const newPreview = files.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type,
      }));

      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...files],
      }));

      setPreviewList((prev) => [...prev, ...newPreview]);
    }
  };

  // ❌ Remove file
  const removeFile = (index: number) => {
    const updatedPreview = [...previewList];
    updatedPreview.splice(index, 1);

    const updatedFiles = [...formData.files];
    updatedFiles.splice(index, 1);

    setPreviewList(updatedPreview);
    setFormData({ ...formData, files: updatedFiles });
    if (previewList?.length === 1 && fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // 🚀 Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      setIsSubmitted(true);
      const validationErrors = validateBusinessGroupForm(formData);
      setErrors(validationErrors);
      if(Object.keys(validationErrors).length > 0)return;
    try {
      setIsLoading(true);

      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("type", formData.type);
      form.append("location", formData.location);

      formData.files.forEach((file) => {
        form.append("media", file); // 🔥 better key
      });

      if (isEdit) {
        form.append("id", initialData?._id);
      }

      const res = await (isEdit ? updateBusinessGroup(form) : createBusinessGroup(form));

      if (res.status === 200 || res.status === 201) {
        toast({
          title: isEdit ? "Business Group Updated" : "Business Group Created",
          description: res?.data?.message,
        });

        setGroupListRefresh(true);
        onOpenChange(false);
        resetForm();
      }
    } catch (err: any) {
      console.log(err);
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message,
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
    <DialogContent className="p-4 md:p-6 max-w-3xl">
      <DialogHeader className="text-left mb-2">
        <DialogTitle className="text-lg md:text-xl font-semibold">
          {isEdit ? "Update Business Group" : "Create Business Group"}
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-600">
          Add your business group details
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="text-left">
        {/* Title */}
        <div className="mb-2">
          <Label>Title</Label>
          <Input
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter title"
          />
          {errors?.title && (
            <p className="text-xs mt-1 text-red-500">{errors?.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="mb-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter description"
          />
          {errors?.description && (
            <p className="text-xs mt-1 text-red-500">{errors?.description}</p>
          )}
        </div>

        {/* Type & Location Row */}
        <div className="mb-3 flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Label>Select Type</Label>
            <Select
              value={formData?.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label>Location</Label>
            <Input
              type="text"
              placeholder="Enter location"
              value={formData?.location || ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
            {errors?.location && (
              <p className="text-xs mt-1 text-red-500">{errors?.location}</p>
            )}
          </div>
        </div>

        {/* Category & File Input Row */}
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          {/* Category */}
          <div className="flex-1">
            <Label>Category</Label>
            <Input
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="Enter category"
            />
            {errors?.category && (
              <p className="text-xs mt-1 text-red-500">{errors?.category}</p>
            )}
          </div>

          {/* File Input */}
          <div className="flex-1">
            <Label>Images / Videos</Label>
            <Input
              type="file"
              multiple
              accept="image/*,video/*"
              ref={fileRef}
              onChange={handleFileChange}
            />
            {errors?.images && (
              <p className="text-xs mt-1 text-red-500">{errors?.images}</p>
            )}
          </div>
        </div>

        {/* Preview Images */}
        {previewList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {previewList.slice(0, 4).map((file, i) => (
              <div
                key={i}
                className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-200"
              >
                {file.type.startsWith("video") ? (
                  <video src={file.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={file.url} className="w-full h-full object-cover" />
                )}
                <div
                  onClick={() => removeFile(i)}
                  className="absolute top-0.5 right-0.5 bg-red-500 rounded-full cursor-pointer p-0.5"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end mt-2">
          <Button disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin w-4 h-4 mr-1" />}
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

export default BusinessGroupDialog;