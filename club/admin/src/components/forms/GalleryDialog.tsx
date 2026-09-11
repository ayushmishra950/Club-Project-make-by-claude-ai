import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../ui/select";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addGallery, updateGallery } from "@/service/gallery";
import { getEvent } from "@/service/event";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setEventList } from "@/redux-toolkit/slice/eventSlice";
import { setNewGallery } from "@/redux-toolkit/slice/gallerySlice";
import ConfirmCard from "@/components/cards/ConfirmCard";

const GalleryDialog = ({ isOpen, onOpenChange, initialData, setGalleryListRefresh }) => {
    const user = JSON.parse(localStorage.getItem("admin.user"));
    const { toast } = useToast();
    const [formData, setFormData] = useState({ event: "all", image: [] });
    const [imagePreview, setImagePreview] = useState([]);
    const [openDialogOpen, setOpenDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isEdit = Boolean(initialData);
    const imageRef = useRef(null);
    const [eventListRefresh, setEventListRefresh] = useState(false);
    const dispatch = useAppDispatch();
    const eventList = useAppSelector((state) => state?.event?.eventList);
    useEffect(() => {
        if (initialData && isOpen) {
            setFormData({ event: initialData?.event?._id || initialData?.event, image: [initialData?.image] });
            setImagePreview([initialData?.image]);
        }
    }, [isOpen, initialData]);


    const resetForm = () => { setImagePreview([]); setFormData({ event: "all", image: [] }) };

    const handleChange = (e) => {
        const selectedFiles = e.target?.files ? Array.from(e.target.files) : [];
        if (selectedFiles.length > 0) {
            const newImages = [...formData.image, ...selectedFiles];
            setFormData({ ...formData, image: newImages });

            const newPreviews = [...imagePreview, ...selectedFiles.map((file: File) => URL.createObjectURL(file))];
            setImagePreview(newPreviews);

            if (e.target) e.target.value = "";
        }
    };

    const removeImage = (index) => {
        if (imagePreview[index].startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview[index]);
        }

        const updatedImages = formData.image.filter((_, i) => i !== index);
        const updatedPreviews = imagePreview.filter((_, i) => i !== index);
        setFormData({ ...formData, image: updatedImages });
        setImagePreview(updatedPreviews);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        let obj: any = { event: formData.event, id: initialData?._id || null }
        const convertFormData = new FormData();
        Object.keys(obj).forEach((k) => {
            const v = obj[k];
            if (v) convertFormData.append(k, v);
        });

        // Append multiple images
        if (Array.isArray(formData.image)) {
            formData.image.forEach((img) => {
                convertFormData.append("image", img);
            });
        }
        console.log(formData);
        try {
            setIsLoading(true);
            const res = await (isEdit ? updateGallery(convertFormData) : addGallery(convertFormData));
            if (res.status === 201 || res.status === 200) {
                toast({ title: isEdit ? "Update Gallery." : "Create Gallery.", description: res?.data?.message });
                dispatch(setNewGallery(res?.data?.gallery));
                onOpenChange(false);
                setOpenDialogOpen(false);
                resetForm();
            }

        } catch (err) {
            console.log(err);
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleGetEvent = async () => {
        try {
            const res = await getEvent();
            if (res.status === 200) {
                dispatch(setEventList(res?.data?.event))
                setEventListRefresh(false);
            }
        }
        catch (err) {
            console.log(err?.message);
        }
    };

    useEffect(() => {
        if (eventListRefresh || eventList?.length === 0) {
            handleGetEvent();
        }

    }, [eventListRefresh, eventList?.length])


    return (
        <>
            <ConfirmCard
                isOpen={openDialogOpen}
                onOpenChange={setOpenDialogOpen}
                onConfirm={handleSubmit}
                title="Gallery Dialog"
                description={` Are You Sure you want to "update" this gallery?`}
                isLoading={isLoading}
                buttonName={`Update Gallery`}
            />
            <Dialog open={isOpen} onOpenChange={(open) => { resetForm(); onOpenChange(open) }} >
                <DialogContent>
                    <DialogHeader className="text-left" >
                        <DialogTitle>Event Gallery</DialogTitle>
                        <DialogDescription>Event Gallery</DialogDescription>
                    </DialogHeader>
                    <form className="text-left" onSubmit={(e) => { e?.preventDefault(); if (isEdit) { setOpenDialogOpen(true) } else { handleSubmit(e) } }} >
                        <div className="my-1">
                            <Label>Select Event</Label>
                            <Select value={formData?.event} onValueChange={(value) => { setFormData({ ...formData, event: value }) }} >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                    <SelectItem value="all">All</SelectItem>
                                    {eventList?.map((v) => <SelectItem value={v?._id} >{v?.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="my-1">
                            <Label>Images</Label>
                            <Input type="file" multiple onChange={handleChange} ref={imageRef} />

                            <div className="flex flex-wrap gap-3 mt-3">
                                {imagePreview.map((img, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted group">
                                        <img src={img} className="object-cover w-full h-full" />
                                        <div
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="text-white w-5 h-5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button disabled={isLoading || formData?.event === "all" || formData?.image.length === 0}>
                                {isLoading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                                {isEdit ? isLoading ? "Updating..." : "Update" : isLoading ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
};


export default GalleryDialog;