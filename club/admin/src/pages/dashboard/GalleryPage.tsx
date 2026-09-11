import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash } from "lucide-react";
import GalleryDialog from "@/components/forms/GalleryDialog";
import DeleteCard from "@/components/cards/DeleteCard";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setGalleryList, setRemoveGallery } from "@/redux-toolkit/slice/gallerySlice";
import { getAllGallery, removeGallery } from "@/service/gallery";

export default function GalleryPage() {
    const { toast } = useToast();
    const dispatch = useAppDispatch();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
    const [initialData, setIntialData] = useState(null);

    const [deleteGallery, setDeleteGallery] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [galleryListRefresh, setGalleryListRefresh] = useState(false);
    const [viewMode, setViewMode] = useState("table");

    const galleryList = useAppSelector((state) => state?.gallery?.galleryList || []);

    // ---------------- DELETE ----------------
    const handleDeleteGallery = async () => {
        try {
            setDeleteLoading(true);

            const res = await removeGallery(deleteGallery?._id);
            if (res.status === 200) {
                toast({ title: "Gallery Deleted Successfully", description: res?.data?.message });
                dispatch(setRemoveGallery(deleteGallery?._id));
                setDeleteDialogOpen(false);
                setDeleteGallery(null);
            }
        } catch (err) {
            toast({
                title: "Delete Failed",
                description: err?.message,
                variant: "destructive",
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleGetGallery = async () => {
        try {
            const res = await getAllGallery();
            if (res.status === 200) {
                dispatch(setGalleryList(res?.data?.data || []));
                setGalleryListRefresh(false);
            }
        }
        catch (err) {
            console.log(err);
        }
    };


    useEffect(() => {
        if (galleryList?.length === 0 || galleryListRefresh) {
            handleGetGallery();
        }
    }, [galleryList?.length, galleryListRefresh])

    return (
        <>
            {/* DELETE MODAL */}
            <DeleteCard
                isOpen={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                isLoading={deleteLoading}
                buttonName="Delete"
                title={`Delete Gallery: ${deleteGallery?.event?.title}`}
                description={`Are you sure you want to delete "${deleteGallery?.event?.title}"? This action cannot be undone.`}
                onConfirm={handleDeleteGallery}
            />

            {/* GALLERY FORM */}
            <GalleryDialog
                isOpen={galleryDialogOpen}
                onOpenChange={setGalleryDialogOpen}
                initialData={initialData}
                setGalleryListRefresh={setGalleryListRefresh}
            />

            <div className="space-y-4">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h3 className="font-display font-semibold text-lg">All Gallery</h3>

                    <div className="flex gap-2 items-center">

                        {/* VIEW TOGGLE */}
                        <Button
                            size="sm"
                            variant={viewMode === "table" ? "default" : "outline"}
                            onClick={() => setViewMode("table")}
                        >
                            Table
                        </Button>

                        <Button
                            size="sm"
                            variant={viewMode === "grid" ? "default" : "outline"}
                            onClick={() => setViewMode("grid")}
                        >
                            Grid
                        </Button>

                        {/* CREATE BUTTON */}
                        <Button
                            className="gradient-gold text-secondary-foreground font-semibold"
                            onClick={() => {
                                setIntialData(null);
                                setGalleryDialogOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Gallery
                        </Button>

                    </div>
                </div>

                {/* ================= TABLE VIEW ================= */}
                {viewMode === "table" && (
                    <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">

                            <thead className="bg-gray-100 text-left text-sm">
                                <tr>
                                    <th className="p-3">Image</th>
                                    <th className="p-3">Title</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {galleryList?.map((gallery) => (
                                    <tr key={gallery._id} className="border-t hover:bg-gray-50">

                                        <td className="p-3">
                                            <img
                                                src={gallery?.image?.[0] || gallery?.image}
                                                className="w-12 h-12 rounded-md object-cover"
                                            />
                                        </td>

                                        <td className="p-3 font-medium">{gallery?.event?.title}</td>

                                        <td className="p-3">
                                            <div className="flex justify-end gap-2">

                                                <button
                                                    onClick={() => {
                                                        setIntialData(gallery);
                                                        setGalleryDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setDeleteGallery(gallery);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash className="w-4 h-4 text-red-500" />
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}

                {/* ================= GRID VIEW ================= */}
                {viewMode === "grid" && (
                    <div className="grid md:grid-cols-3 gap-5">

                        {galleryList?.map((gallery) => (
                            <div
                                key={gallery._id}
                                className="relative h-64 rounded-xl overflow-hidden group shadow-md"
                            >

                                {/* IMAGE */}
                                <img
                                    src={gallery?.image}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition"
                                />

                                {/* OVERLAY */}
                                <div className="absolute inset-0 bg-black/40" />

                                {/* TITLE */}
                                <div className="absolute bottom-3 left-3 text-white font-medium z-10">
                                    {gallery?.event?.title}
                                </div>

                                {/* ACTIONS */}
                                <div className="absolute top-2 right-2 flex gap-2 z-10">

                                    <button
                                        onClick={() => {
                                            setIntialData(gallery);
                                            setGalleryDialogOpen(true);
                                        }}
                                        className="bg-white/80 p-1 rounded"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            setDeleteGallery(gallery);
                                            setDeleteDialogOpen(true);
                                        }}
                                        className="bg-white/80 p-1 rounded"
                                    >
                                        <Trash className="w-4 h-4 text-red-500" />
                                    </button>

                                </div>

                            </div>
                        ))}

                    </div>
                )}

                {/* EMPTY STATE */}
                {galleryList?.length === 0 && (
                    <p className="flex items-center justify-center h-[400px] text-gray-500">
                        No Gallery Found
                    </p>
                )}

            </div>
        </>
    );
}