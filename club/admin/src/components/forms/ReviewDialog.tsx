import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addReviews, updateReviews } from "@/service/review";
import { setNewReview } from "@/redux-toolkit/slice/reviewSlice";
import { useAppDispatch } from "@/redux-toolkit/customHook/hook";

interface Review {
  _id?: string;
  fullName: string;
  description: string;
}

const ReviewDialog = ({ isOpen, onOpenChange, initialData }) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const isEdit = Boolean(initialData);

  // ✅ INIT FORM
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({ fullName: initialData.fullName || "", description: initialData.description || ""});
   
    } else if (isOpen) {
      setFormData({ fullName: "", description: ""});
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData(null);
    setErrors({});
  };

  // ✅ VALIDATION
  const validate = (data: Review) => {
    const err: any = {};
    if (!data.fullName) err.fullName = "Full name is required";
    if (!data.description) err.description = "Description is required";
    return err;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ SUBMIT
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
        ? await updateReviews(payload)
        : await addReviews(payload);

      if (res.status === 200 || res.status === 201) {
        toast({
          title: isEdit ? "Review Updated" : "Review Created",
          description: res.data.message,
        });

        dispatch(setNewReview(res?.data?.data));

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
          <DialogTitle>
            {isEdit ? "Edit Review" : "Add Review"}
          </DialogTitle>
          <DialogDescription>
            Manage customer reviews
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* FULL NAME */}
          <div>
            <Label>Full Name</Label>
            <Input
              name="fullName"
              value={formData?.fullName || ""}
              onChange={handleChange}
              placeholder="Enter full name..."
              className={errors?.fullName ? "border-red-500" : ""}
            />
            {errors?.fullName && (
              <p className="text-xs text-red-500">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <Label>Description</Label>
            <Textarea
              name="description"
              value={formData?.description || ""}
              onChange={handleChange}
              placeholder="Enter review..."
              className={errors?.description ? "border-red-500" : ""}
            />
            {errors?.description && (
              <p className="text-xs text-red-500">
                {errors.description}
              </p>
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
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

export default ReviewDialog;