import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createGroup, updateGroup } from "@/service/group";
import { validateGroupForm } from "../hook/group.form";
import ConfirmCard from "@/components/cards/ConfirmCard";


const GroupDialog = ({ isOpen, onOpenChange, initialData, setGroupListRefresh }) => {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("admin.user") || "{}");
  const [formData, setFormData] = useState({ title: "", description: "", files: [] });
  const [previewList, setPreviewList] = useState<{ url: string; type: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const isEdit = Boolean(initialData);
  const fileRef = useRef<HTMLInputElement>(null);

  // 🔁 Edit Mode
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        files: initialData?.images || [],
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
    setFormData({ title: "", description: "", files: [] });
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

      let obj = { ...formData, files: [...formData.files, ...files] };
      setFormData(obj);
      if (isSubmitted) {
        const validationErrors = validateGroupForm(obj);
        setErrors(validationErrors);
      }
      setPreviewList((prev) => [...prev, ...newPreview]);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    let obj = { ...formData, [name]: value };
    setFormData(obj);

    if (isSubmitted) {
      const validationErrors = validateGroupForm(obj);
      setErrors(validationErrors);
    }
  }

  // ❌ Remove file
  const removeFile = (index: number) => {
    const updatedPreview = [...previewList];
    updatedPreview.splice(index, 1);

    const updatedFiles = [...formData.files];
    updatedFiles.splice(index, 1);
    const obj = { ...formData, files: updatedFiles };

    setPreviewList(updatedPreview);
    setFormData(obj);
    if (isSubmitted) {
      const validationErrors = validateGroupForm(obj);
      setErrors(validationErrors);
    };
    if (previewList?.length === 1 && fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // 🚀 Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    const validationErrors = validateGroupForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsLoading(true);

      const form = new FormData();
      form.append("createdBy", user?._id);
      form.append("title", formData.title);
      form.append("description", formData.description);

      formData.files.forEach((file) => {
        form.append("media", file); // 🔥 better key
      });

      if (isEdit) {
        form.append("id", initialData?._id);
      }

      const res = await (isEdit ? updateGroup(form) : createGroup(form));

      if (res.status === 200 || res.status === 201) {
        toast({
          title: isEdit ? "Group Updated" : "Group Created",
          description: res?.data?.message,
        });

        setGroupListRefresh(true);
        setOpenDialogOpen(false);
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
    <>
      <ConfirmCard
        isOpen={openDialogOpen}
        onOpenChange={setOpenDialogOpen}
        onConfirm={(e) => handleSubmit(e)}
        title="Group Dialog"
        description={` Are You Sure you want to ${isEdit ? "update" : "add"} this group?`}
        isLoading={isLoading}
        buttonName={`${isEdit ? "Update" : "Add"} Group`}
      />
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          resetForm();
          onOpenChange(open);
        }}
      >
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>
              {isEdit ? "Update Group" : "Create Group"}
            </DialogTitle>
            <DialogDescription>
              Add your group details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); setOpenDialogOpen(true) }} className="text-left">
            {/* Title */}
            <div className="my-1">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={handleChange}
                name="title"
                placeholder="Enter title"
              />
              {errors?.title && <p className="text-xs mt-1 text-red-500">{errors?.title}</p>}
            </div>

            {/* Description */}
            <div className="my-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={handleChange}
                name="description"
                placeholder="Enter description"
              />
              {errors?.description && <p className="text-xs mt-1 text-red-500">{errors?.description}</p>}
            </div>
            {/* Media */}
            <div className="my-4 flex items-start gap-4">
              {/* File Input - Chhota width */}
              <div className="w-1/3">
                <Label>Images / Videos</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  ref={fileRef}
                  onChange={handleFileChange}
                  className="w-full"
                />
                {errors?.images && (
                  <p className="text-xs mt-1 text-red-500">{errors?.images}</p>
                )}
              </div>

              {/* Preview - Horizontal row */}
              {previewList.length > 0 && (
                <div className="flex gap-2 overflow-x-auto flex-1 mt-6">
                  {previewList.slice(0, 4).map((file, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 flex-shrink-0 bg-black rounded overflow-hidden"
                    >
                      {file.type.startsWith("video") ? (
                        <video
                          src={file.url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={file.url}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Remove button */}
                      <div
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 bg-red-500 rounded-full cursor-pointer p-0.5"
                      >
                        <X className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Submit */}
            <div className="flex justify-end mt-3">
              <Button
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="animate-spin w-4 h-4 mr-1" />
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
    </>
  );
};

export default GroupDialog;