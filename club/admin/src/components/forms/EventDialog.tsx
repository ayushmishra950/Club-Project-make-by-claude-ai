// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
// import { Button } from "../ui/button";
// import { Label } from "../ui/label";
// import { Input } from "../ui/input";
// import { Textarea } from "../ui/textarea";
// import { useEffect, useRef, useState } from "react";
// import { Loader2, X } from "lucide-react";
// import { ValidateEventStep } from "../hook/event.form";
// import { useToast } from "@/hooks/use-toast";
// import { addEvent, updateEvent } from "@/service/event";
// import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
// import { formatDateTimeLocal } from "@/service/global";
// import socket from "@/socket/socket";
// import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../ui/select";
// import ConfirmCard from "@/components/cards/ConfirmCard";


// interface Event {
//     _id?: string;
//     title: string;
//     description: string;
//     date: string;
//     location: string;
//     category: string;
//     coverImage: string | File;
//     type: "public" | "private";
//     isPinned: boolean;
// }

// const EventDialog = ({ isOpen, onOpenChange, initialData, setEventListRefresh }) => {
//     // const { user } = useAuth();
//     const user = JSON.parse(localStorage.getItem("admin.user"))
//     const { toast } = useToast();
//     const [formData, setFormData] = useState<Event | null>();
//     const [isLoading, setIsLoading] = useState(false);
//     const [errorCheck, setErrorCheck] = useState(false);
//     const [errors, setErrors] = useState<any>();
//     const [preview, setPreview] = useState(null);
//     const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
//     const dateRef = useRef(null);
//     const imageRef = useRef(null);
//     const isEdit = Boolean(initialData);


//     useEffect(() => {

//         if (initialData && isOpen) {
//             setPreview(initialData?.coverImage);
//             setFormData({
//                 title: initialData?.title,
//                 type: "public",
//                 coverImage: initialData?.coverImage,
//                 description: initialData?.description,
//                 category: initialData?.category,
//                 date: formatDateTimeLocal(initialData?.date),
//                 location: initialData?.location,
//                 isPinned: initialData?.isPinned || false
//             });
//         }
//         else if (isOpen) {
//             setFormData({
//                 title: "",
//                 description: "",
//                 date: "",
//                 location: "",
//                 category: "",
//                 coverImage: "",
//                 type: "public",
//                 isPinned: false
//             });
//             setPreview(null);
//         }
//     }, [initialData, isOpen]);



//     const resetForm = () => { setFormData(null); setPreview(null) }

//     const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         const { name, value, files } = e.target as HTMLInputElement;
//         const newFormData = { ...formData, [name]: files ? files[0] : value }
//         setFormData(newFormData);

//         if (files && files[0]) {
//             setPreview(URL.createObjectURL(files[0]));
//         }

//         if (errorCheck) {
//             const errorData = ValidateEventStep(newFormData);
//             setErrors(errorData);
//         }
//     }

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             setErrorCheck(true);
//             const errorData = ValidateEventStep(formData);
//             setErrors(errorData);
//             if (Object.keys(errorData).length > 0) return;
//             let obj = { ...formData, id: initialData?._id || null, userId: user?._id };
//             setIsLoading(true);
//             const convertFormData = new FormData();
//             Object.keys(obj).forEach((k) => {
//                 const value = obj[k];
//                 if (value !== undefined && value !== null) {
//                     convertFormData.append(k, value);
//                 }
//             })
//             const res = await (isEdit ? updateEvent(obj) : addEvent(obj));
//             if (res.status === 201 || res.status === 200) {
//                 toast({ title: isEdit ? "Update Event." : "Create Event.", description: res.data.message });
//                 resetForm();
//                 socket.emit("event");
//                 setEventListRefresh(true);
//                 onOpenChange(false);

//                 setPreview(null)
//             }

//         }
//         catch (err) {
//             toast({ title: "Event Error.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
//         } finally {
//             setIsLoading(false);
//             setConfirmDialogOpen(false);
//         }
//     }
//     return (
//         <>
//             <ConfirmCard
//                 isOpen={confirmDialogOpen}
//                 onOpenChange={setConfirmDialogOpen}
//                 isLoading={isLoading}
//                 buttonName="Update Event"
//                 title="Update Event"
//                 description="Are you sure you want to update this event? The changes will be saved permanently."
//                 onConfirm={(e) => { handleSubmit(e) }}
//             />
//             <Dialog open={isOpen} onOpenChange={(open) => { resetForm(); onOpenChange(open) }} >
//                 <DialogContent>
//                     <DialogHeader>
//                         <DialogTitle>{isEdit ? "Edit" : "New"} Event</DialogTitle>
//                         <DialogDescription>Event</DialogDescription>
//                     </DialogHeader>

//                     <form id="scrollArrow" className="p-1 max-h-[500px] overflow-y-auto no-scrollbar" onSubmit={(e) => { e.preventDefault(); if (initialData && initialData?._id) { setConfirmDialogOpen(true) } else { handleSubmit(e) } }}>
//                         <div>
//                             <Label>Title</Label>
//                             <Input type="text" name="title" value={formData?.title} onChange={handleChange} placeholder="Enter Title..." className={errors?.title ? `border border-red-500` : `border border-input`} />
//                             {errors?.title && <span className="mt-1 text-xs text-red-500" >{errors?.title}</span>}
//                         </div >
//                         <div className="my-1">
//                             <Label>Description</Label>
//                             <Textarea name="description" value={formData?.description} onChange={handleChange} placeholder="Enter Description..." className={errors?.description ? `border border-red-500` : `border border-input`} />
//                             {errors?.description && <span className="mt-1 text-xs text-red-500" >{errors?.description}</span>}
//                         </div>
//                         <div className="my-1">
//                             <Label>Category</Label>
//                             <Input type="text" name="category" value={formData?.category} onChange={handleChange} placeholder="Enter Category..." className={errors?.category ? `border border-red-500` : `border border-input`} />
//                             {errors?.category && <span className="mt-1 text-xs text-red-500" >{errors?.category}</span>}
//                         </div>
//                         <div className="my-1">
//                             <Label>Type</Label>
//                             <Select value={formData?.type} onValueChange={(value: "public" | "private") => { setFormData({ ...formData, type: value }) }}>
//                                 <SelectTrigger>
//                                     <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="public">Public</SelectItem>
//                                     <SelectItem value="private">Private</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                         <div className="flex gap-3">
//                             <div className="flex-1">
//                                 <Label>Date</Label>
//                                 <Input name="date" type="datetime-local" ref={dateRef} value={formData?.date} onChange={handleChange} onClick={() => { if (dateRef.current?.showPicker) { dateRef.current.showPicker() } }} className={errors?.date ? `border border-red-500` : `border border-input`} />
//                                 {errors?.date && <span className="mt-1 text-xs text-red-500" >{errors?.date}</span>}

//                             </div>
//                             <div className="flex-1">
//                                 <Label>Location</Label>
//                                 <Input type="text" name="location" value={formData?.location} onChange={handleChange} placeholder="Enter Location..." className={errors?.location ? `border border-red-500` : `border border-input`} />
//                                 {errors?.location && <span className="mt-1 text-xs text-red-500" >{errors?.location}</span>}
//                             </div>
//                         </div>
//                         <div className="flex gap-3">
//                             <div className="flex-1">
//                                 <Label>CoverImage</Label>
//                                 <Input name="coverImage" ref={imageRef} type="file" onChange={handleChange} className={errors?.coverImage ? `border border-red-500` : `border border-input`} />
//                                 {errors?.coverImage && <span className="mt-1 text-xs text-red-500" >{errors?.coverImage}</span>}

//                             </div>
//                             <div className="flex-1">
//                                 {preview && <div className="relative w-[100px] h-[50px]">
//                                     <img src={preview} className="w-[80px] h-[50px] mt-6 ml-6" />
//                                     <div className="absolute right-0 top-0 text-red-500 bg-white rounded-full w-[20px] h-[20px] cursor-pointer" onClick={() => {
//                                         setPreview(null);
//                                         if (imageRef.current) { imageRef.current.value = null }
//                                         let obj = { ...formData, coverImage: null };
//                                         setFormData(obj);
//                                         if (errorCheck) {
//                                             const errorData = ValidateEventStep(obj);
//                                             setErrors(errorData);
//                                         }
//                                     }}><X className="w-[18px] h-[18px] mt-0.5 ml-0.4" /></div>
//                                 </div>}
//                             </div>
//                         </div>

//                         <div className="flex items-center gap-2 my-4">
//                             <input
//                                 type="checkbox"
//                                 id="isPinned"
//                                 name="isPinned"
//                                 checked={formData?.isPinned}
//                                 onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
//                                 className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                             />
//                             <Label htmlFor="isPinned" className="cursor-pointer font-semibold text-blue-600">Pin this Event (Show on Ticker)</Label>
//                         </div>


//                         <div className="flex justify-end mt-4 gap-2">
//                             <Button type="button" onClick={() => { resetForm(); onOpenChange(false) }} className="bg-white text-black  border border-gray-200 hover:text-white hover:border-none">Cancel</Button>
//                             <Button type="submit" disabled={isLoading} >
//                                 {isLoading && <Loader2 className="w-2 h-2 animate-spin" />}
//                                 {isEdit ? isLoading ? "Updating..." : "Update" : isLoading ? "Creating..." : "Create"}
//                             </Button>
//                         </div>
//                     </form>
//                     <div
//                         id="scrollArrow"
//                         className="absolute bottom-3 left-[240px] bg-transparent text-black p-2 rounded-full shadow animate-bounce"
//                     >
//                         ↓
//                     </div>

//                 </DialogContent>
//             </Dialog>
//         </>
//     )
// };


// export default EventDialog;







import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { ValidateEventStep } from "../hook/event.form";
import { useToast } from "@/hooks/use-toast";
import { addEvent, updateEvent } from "@/service/event";
import { formatDateTimeLocal } from "@/service/global";
import socket from "@/socket/socket";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../ui/select";
import ConfirmCard from "@/components/cards/ConfirmCard";

interface Event {
    _id?: string;
    title: string;
    description: string;
    date: string;
    location: string;
    category: string;
    coverImage: (string | File)[];
    type: "public" | "private";
    isPinned: boolean;
}

const EventDialog = ({ isOpen, onOpenChange, initialData, setEventListRefresh }) => {
    const user = JSON.parse(localStorage.getItem("admin.user") || "{}");
    const { toast } = useToast();
    const [formData, setFormData] = useState<Event | null>();
    const [isLoading, setIsLoading] = useState(false);
    const [errorCheck, setErrorCheck] = useState(false);
    const [errors, setErrors] = useState<any>();
    const [preview, setPreview] = useState<any[]>([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const dateRef = useRef<any>(null);
    const imageRef = useRef<any>(null);

    const isEdit = Boolean(initialData);

    useEffect(() => {
        if (initialData && isOpen) {
            setPreview(initialData?.coverImage || []);

            setFormData({
                title: initialData?.title,
                type: initialData?.type || "public",
                coverImage: initialData?.coverImage || [],
                description: initialData?.description,
                category: initialData?.category,
                date: formatDateTimeLocal(initialData?.date),
                location: initialData?.location,
                isPinned: initialData?.isPinned || false,
            });
        } else if (isOpen) {
            setFormData({ title: "", description: "", date: "", location: "", category: "", coverImage: [], type: "public", isPinned: false, });
            setPreview([]);
        }
    }, [initialData, isOpen]);

    const resetForm = () => {
        setFormData(null);
        setPreview([]);
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, files } = e.target as HTMLInputElement;
        let newFormData: any = { ...formData };
        if (name === "coverImage") {
            const selectedFiles = files ? Array.from(files) : [];
            const currentImages = Array.isArray(formData?.coverImage) ? formData.coverImage : [];
            const newCoverImages = [...currentImages, ...selectedFiles];
            newFormData.coverImage = newCoverImages;
            const newPreviews = [...(preview || []), ...selectedFiles.map(file => URL.createObjectURL(file))];
            setPreview(newPreviews);
        } else {
            newFormData[name] = value;
        }
        setFormData(newFormData);
        if (errorCheck) {
            const errorData = ValidateEventStep(newFormData);
            setErrors(errorData);
        }
    };

    const removeImage = (index: number) => {
        const updatedImages = formData?.coverImage?.filter((_: any, i: number) => i !== index) || [];
        const updatedPreview = preview?.filter((_: any, i: number) => i !== index) || [];
        const updatedData = { ...formData, coverImage: updatedImages, };
        setFormData(updatedData);
        setPreview(updatedPreview);

        if (errorCheck) {
            const errorData = ValidateEventStep(updatedData);
            setErrors(errorData);
        }
    };


    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            setErrorCheck(true);
            const errorData = ValidateEventStep(formData);
            setErrors(errorData);
            if (Object.keys(errorData).length > 0) return;

            let obj: any = { ...formData, id: initialData?._id || null, userId: user?._id };

            const convertFormData = new FormData();

            Object.keys(obj).forEach((k) => {
                const value = obj[k];

                if (k === "coverImage") {
                    value?.forEach((img: any) => { convertFormData.append("coverImage", img); });
                }
                else if (value !== undefined && value !== null) { convertFormData.append(k, value); }
            });
            setIsLoading(true);
            const res = await (isEdit ? updateEvent(convertFormData) : addEvent(convertFormData));
            if (res.status === 201 || res.status === 200) {
                toast({ title: isEdit ? "Update Event." : "Create Event.", description: res.data.message, });
                resetForm();
                socket.emit("event");
                setEventListRefresh(true);
                onOpenChange(false);
                setPreview([]);
            }
        } catch (err: any) {
            toast({ title: "Event Error.", description: err?.response?.data?.message || err?.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
            setConfirmDialogOpen(false);
        }
    };

    return (
        <>
            <ConfirmCard
                isOpen={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                isLoading={isLoading}
                buttonName="Update Event"
                title="Update Event"
                description="Are you sure you want to update this event? The changes will be saved permanently."
                onConfirm={(e) => {
                    handleSubmit(e);
                }}
            />

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    resetForm();
                    onOpenChange(open);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle> {isEdit ? "Edit" : "New"} Event</DialogTitle>
                        <DialogDescription> Event  </DialogDescription>
                    </DialogHeader>

                    <form
                        id="scrollArrow"
                        className="p-1 max-h-[500px] overflow-y-auto no-scrollbar"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (initialData && initialData?._id) { setConfirmDialogOpen(true); } else {
                                handleSubmit(e);
                            }
                        }}>
                        <div>
                            <Label>Title</Label>

                            <Input
                                type="text"
                                name="title"
                                value={formData?.title}
                                onChange={handleChange}
                                placeholder="Enter Title..."
                                className={errors?.title ? `border border-red-500` : `border border-input`} />

                            {errors?.title && (
                                <span className="mt-1 text-xs text-red-500">
                                    {errors?.title}
                                </span>
                            )}
                        </div>

                        <div className="my-1">
                            <Label>Description</Label>

                            <Textarea
                                name="description"
                                value={formData?.description}
                                onChange={handleChange}
                                placeholder="Enter Description..."
                                className={errors?.description ? `border border-red-500` : `border border-input`} />

                            {errors?.description && (
                                <span className="mt-1 text-xs text-red-500">
                                    {errors?.description}
                                </span>
                            )}
                        </div>

                        <div className="my-1">
                            <Label>Category</Label>

                            <Input
                                type="text"
                                name="category"
                                value={formData?.category}
                                onChange={handleChange}
                                placeholder="Enter Category..."
                                className={errors?.category ? `border border-red-500` : `border border-input`} />

                            {errors?.category && (
                                <span className="mt-1 text-xs text-red-500">
                                    {errors?.category}
                                </span>
                            )}
                        </div>

                        <div className="my-1">
                            <Label>Type</Label>

                            <Select value={formData?.type} onValueChange={(value: "public" | "private") => {
                                setFormData({ ...formData, type: value, });
                            }}>
                                <SelectTrigger> <SelectValue /> </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public"> Public </SelectItem>
                                    <SelectItem value="private"> Private </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <Label>Date</Label>

                                <Input
                                    name="date"
                                    type="datetime-local"
                                    ref={dateRef}
                                    value={formData?.date}
                                    onChange={handleChange}
                                    onClick={() => {
                                        if (dateRef.current?.showPicker) { dateRef.current.showPicker(); }
                                    }}
                                    className={errors?.date ? `border border-red-500` : `border border-input`} />

                                {errors?.date && (<span className="mt-1 text-xs text-red-500"> {errors?.date} </span>)}
                            </div>

                            <div className="flex-1">
                                <Label>Location</Label>
                                <Input
                                    type="text"
                                    name="location"
                                    value={formData?.location}
                                    onChange={handleChange}
                                    placeholder="Enter Location..."
                                    className={errors?.location ? `border border-red-500` : `border border-input`} />

                                {errors?.location && (
                                    <span className="mt-1 text-xs text-red-500">
                                        {errors?.location}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="my-3">
                            <Label>Cover Images</Label>

                            <Input
                                name="coverImage"
                                ref={imageRef}
                                type="file"
                                multiple
                                onChange={handleChange}
                                className={errors?.coverImage ? `border border-red-500` : `border border-input`} />

                            {errors?.coverImage && (
                                <span className="mt-1 text-xs text-red-500"> {errors?.coverImage} </span>)}
                        </div>

                        {preview?.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-3">
                                {preview.map((img: any, index: number) => (
                                    <div key={index} className="relative w-[100px] h-[70px]">
                                        <img src={img} className="w-full h-full rounded-md object-cover border" />

                                        <div className="absolute -top-2 -right-2 text-red-500 bg-white rounded-full w-[22px] h-[22px] cursor-pointer flex items-center justify-center shadow" onClick={() => removeImage(index)}>
                                            <X className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2 my-4">
                            <input
                                type="checkbox"
                                id="isPinned"
                                name="isPinned"
                                checked={formData?.isPinned}
                                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked, })}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />

                            <Label htmlFor="isPinned" className="cursor-pointer font-semibold text-blue-600"> Pin this Event (Show on Ticker) </Label>
                        </div>

                        <div className="flex justify-end mt-4 gap-2">
                            <Button type="button" onClick={() => { resetForm(); onOpenChange(false); }} className="bg-white text-black border border-gray-200 hover:text-white hover:border-none"> Cancel </Button>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading && (<Loader2 className="w-4 h-4 animate-spin mr-1" />)}

                                {isEdit ? isLoading ? "Updating..." : "Update" : isLoading ? "Creating..." : "Create"} </Button>
                        </div>
                    </form>
                    <div id="scrollArrow" className="absolute bottom-3 left-[240px] bg-transparent text-black p-2 rounded-full shadow animate-bounce"> ↓ </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default EventDialog;