import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addNews, updateNews } from "@/service/news";
import {setNewNews} from "@/redux-toolkit/slice/newsSlice";
import { useAppDispatch } from "@/redux-toolkit/customHook/hook";

interface News {
  _id?: string;
  title: string;
  description: string;
  category: string;
}

const NewsDialog = ({ isOpen, onOpenChange, initialData }) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const isEdit = Boolean(initialData);

  // 👉 form init
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        category: initialData.category || "",
      });
    } else if (isOpen) {
      setFormData({
        title: "",
        description: "",
        category: "",
      });
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData(null);
    setErrors({});
  };

  // 👉 simple validation
  const validate = (data: News) => {
    const err: any = {};
    if (!data.title) err.title = "Title is required";
    if (!data.description) err.description = "Description is required";
    if (!data.category) err.category = "Category is required";
    return err;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData!);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsLoading(true);

      const payload = {
        ...formData,
        id: initialData?._id || null,
      };

      const res = isEdit
        ? await updateNews(payload)
        : await addNews(payload);
      if (res.status === 200 || res.status === 201) {
        toast({
          title: isEdit ? "News Updated" : "News Created",
          description: res.data.message,
        });
         dispatch(setNewNews(res?.data?.data));
        resetForm();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err.message,
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
          <DialogTitle>{isEdit ? "Edit" : "Add"} News</DialogTitle>
          <DialogDescription>Manage News</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input
              name="title"
              value={formData?.title || ""}
              onChange={handleChange}
              placeholder="Enter title..."
              className={errors?.title ? "border-red-500" : ""}
            />
            {errors?.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              name="description"
              value={formData?.description || ""}
              onChange={handleChange}
              placeholder="Enter description..."
              className={errors?.description ? "border-red-500" : ""}
            />
            {errors?.description && (
              <p className="text-xs text-red-500">
                {errors.description}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Input
              name="category"
              value={formData?.category || ""}
              onChange={handleChange}
              placeholder="Enter category..."
              className={errors?.category ? "border-red-500" : ""}
            />
            {errors?.category && (
              <p className="text-xs text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              variant="outline"
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
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

export default NewsDialog;