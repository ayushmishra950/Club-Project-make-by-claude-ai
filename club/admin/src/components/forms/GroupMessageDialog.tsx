import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import {addAnnouncement} from "@/service/announcement";
import {addMessage} from "@/service/chat";
import { useToast } from "@/hooks/use-toast";

const GroupMessageDialog = ({ isOpen, onOpenChange, group}) => {
  const user = JSON.parse(localStorage.getItem("admin.user"));
  const {toast} = useToast();
  const fileRef = useRef(null);
  const [formData, setFormData] = useState({ message: "", files: []});
  const [previewList, setPreviewList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ---------------- RESET ----------------
  const resetForm = () => {
    setFormData({ message: "", files: [] });
    setPreviewList([]);
  };

  // ---------------- FILE CHANGE ----------------
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 0) {
      const previews = files.map((file:File) => ({
        url: URL.createObjectURL(file),
        type: file.type,
      }));

      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...files],
      }));

      setPreviewList((prev) => [...prev, ...previews]);
    }
  };

  // ---------------- REMOVE FILE ----------------
  const removeFile = (index) => {
    const updatedFiles = [...formData.files];
    const updatedPreview = [...previewList];

    updatedFiles.splice(index, 1);
    updatedPreview.splice(index, 1);

    setFormData({ ...formData, files: updatedFiles });
    setPreviewList(updatedPreview);

    if (updatedFiles.length === 0 && fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!group?._id)return toast({title:"groupId is required.", variant:"destructive"})
    try {
      setIsLoading(true);
      const form = new FormData();
      form.append("userId", user?._id);
      form.append("groupId", group?._id);
      form.append("message", formData.message);

      formData.files.forEach((file) => {
        form.append("image", file);
      });
      
      const res = await addMessage(form);
      if(res.status === 201){
        toast({title:"message sent Successfully.", description:res?.data?.message});
          onOpenChange(false);
          resetForm();
      }
     
    } catch (err) {
      console.log(err);
      toast({title:"Group Message Failed.", description:err?.response?.data?.message || err?.message, variant:"destructive"})
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open)=>{resetForm();onOpenChange(open)}}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Group Message</DialogTitle>
          <DialogDescription>
            {group?.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ---------------- MESSAGE ---------------- */}
          <div>
            <Label>Message</Label>
            <Textarea
              value={formData.message}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  message: e.target.value,
                })
              }
              placeholder="Write your message..."
            />
          </div>

          {/* ---------------- FILE INPUT ---------------- */}
          <div>
            <Label>Images / Videos</Label>
            <Input
              type="file"
              multiple
              accept="image/*,video/*"
              ref={fileRef}
              onChange={handleFileChange}
            />
          </div>

          {/* ---------------- PREVIEW ---------------- */}
          {previewList.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {previewList.map((file, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-black"
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

                  {/* REMOVE */}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-red-500 p-0.5 rounded-full"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ---------------- SUBMIT ---------------- */}
          <div className="flex justify-end">
            <Button disabled={isLoading}>
              {isLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Send Message
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GroupMessageDialog;