import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PostDialog from "@/components/forms/PostDialog";
import { getAllPost, deletePost } from "@/service/post";
import { Plus, Calendar, MapPin, Users, Clock, Edit, Trash, Heart, HeartCrack, Pin } from "lucide-react";
import DeleteCard from "@/components/cards/DeleteCard";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setPostList, setDeletePostFromList } from "@/redux-toolkit/slice/postSlice";
import socket from "@/socket/socket";


export default function PostPage({ type }: { type?: "admin" | "user" }) {
    const { toast } = useToast();
    const [postDialogOpen, setPostDialogOpen] = useState(false);
    const [postListRefresh, setPostListRefresh] = useState(false);
    const [initialData, setIntialData] = useState(null);
    const [deletePosts, setDeletePosts] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const dispatch = useAppDispatch();
    const postList = useAppSelector((state) => state?.post?.postList);
    const filteredPosts = postList?.filter((post: any) => {
        if (type === "admin") return post?.create === "Admin";
        if (type === "user") return post?.create === "User";
        return true;
    });


    const handleDeletePost = async () => {
        try {
            setDeleteLoading(true);
            const res = await deletePost(deletePosts?._id);

            if (res?.status === 200) {
                toast({ title: "User Deleted Successfully.", description: res?.data?.message });
                setPostListRefresh(true);
                setDeleteDialogOpen(false);
                setDeletePosts(null);
            }
        }
        catch (err) {
            console.log(err);
            toast({ title: "User Deleted Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
        } finally {
            setDeleteLoading(false);
        }

    };

    const handleGetPosts = async () => {
        try {
            const res = await getAllPost();
            if (res.status === 200) {
                dispatch(setPostList(res?.data?.posts));
                setPostListRefresh(false);
            }
        }
        catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (postList?.length === 0 || postListRefresh) {
            handleGetPosts();
        }
    }, [postList?.length, postListRefresh])

    useEffect(() => {
        socket.on("postRefresh", () => {
            handleGetPosts();
        });

        socket.on("postDeleted", (data) => {
            dispatch(setDeletePostFromList(data))
        });

        return () => {
            socket.off("postRefresh");
            socket.off("postDeleted");
        };
    }, []);

    return (
        <>
            <DeleteCard
                isOpen={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                isLoading={deleteLoading}
                buttonName="Delete"
                title={`Delete Post: ${deletePosts?.title}`} // Dynamic title
                description={`Are you sure you want to delete the post "${deletePosts?.title}"? This action cannot be undone.`} // Dynamic description
                onConfirm={handleDeletePost}
            />

            <PostDialog isOpen={postDialogOpen} onOpenChange={setPostDialogOpen} initialData={initialData} setPostListRefresh={setPostListRefresh} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h3 className="font-display font-semibold text-lg">{type === "user" ? "User Posts" : "Admin Posts"}</h3>
                    {type !== "user" && (
                        <Button
                            className="gradient-gold text-secondary-foreground font-semibold"
                            onClick={() => { setIntialData(null); setPostDialogOpen(true); }}
                        >
                            <Plus className="h-4 w-4 mr-1" /> Post
                        </Button>
                    )}
                </div>

                {/* Grid Container */}

                <div className="max-w-6xl mx-auto px-4">
                    {filteredPosts?.length > 0 ? (
                        <>
                            {/* ================= DESKTOP TABLE ================= */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                                    <thead className="bg-gray-100 text-left text-sm">
                                        <tr>
                                            <th className="p-3">Media</th>
                                            <th className="p-3">Title</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Likes</th>
                                            <th className="p-3">Comments</th>
                                            <th className="p-3 text-center">Pinned</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredPosts?.map((post) => {
                                            const url = post.images?.[0];
                                            const extension = url?.split(".").pop()?.toLowerCase();

                                            const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension || "");
                                            const isVideo = ["mp4", "webm", "mov"].includes(extension || "");

                                            return (
                                                <tr key={post._id} className="border-t hover:bg-gray-50">
                                                    {/* Media */}
                                                    <td className="p-3">
                                                        {url && isImage && (
                                                            <img
                                                                src={url}
                                                                className="w-12 h-12 rounded-full object-cover border"
                                                            />
                                                        )}

                                                        {url && isVideo && (
                                                            <video
                                                                src={url}
                                                                className="w-12 h-12 rounded-full object-cover"
                                                            />
                                                        )}
                                                    </td>

                                                    {/* Title */}
                                                    <td className="p-3 font-medium">{post.title}</td>

                                                    {/* Type */}
                                                    <td className="p-3 text-sm">{post.type}</td>

                                                    {/* Date */}
                                                    <td className="p-3 text-sm">
                                                        {new Date(post.createdAt)?.toLocaleDateString()}
                                                    </td>

                                                    {/* Likes */}
                                                    <td className="p-3 text-sm">{post?.likes?.length}</td>

                                                    {/* Comments */}
                                                    <td className="p-3 text-sm">{post?.comments?.length}</td>
                                                    <td className="p-3 text-center">
                                                        {post?.isPinned ? (
                                                            <div className="flex justify-center">
                                                                <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">No</span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-3">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setIntialData(post);
                                                                    setPostDialogOpen(true);
                                                                }}
                                                                className="p-1.5 hover:bg-gray-100 rounded"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setDeletePosts(post);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                className="p-1.5 hover:bg-red-100 rounded"
                                                            >
                                                                <Trash className="w-4 h-4 text-red-500" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ================= MOBILE VIEW ================= */}
                            <div className="md:hidden space-y-3">
                                {filteredPosts?.map((post) => {
                                    const url = post.images?.[0];
                                    const extension = url?.split(".").pop()?.toLowerCase();

                                    const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension || "");
                                    const isVideo = ["mp4", "webm", "mov"].includes(extension || "");

                                    return (
                                        <div
                                            key={post._id}
                                            className="border rounded-lg p-3 flex gap-3 items-start"
                                        >
                                            {/* Media */}
                                            <div>
                                                {url && isImage && (
                                                    <img
                                                        src={url}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                )}

                                                {url && isVideo && (
                                                    <video
                                                        src={url}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-sm">{post.title}</h3>
                                                    {post?.isPinned && <Pin className="w-3 h-3 text-blue-600 fill-blue-600" />}
                                                </div>

                                                <p className="text-xs text-gray-500">
                                                    {new Date(post.createdAt)?.toLocaleDateString()}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    {post.type}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    ❤️ {post?.likes?.length} • 💬 {post?.comments?.length}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => {
                                                        setIntialData(post);
                                                        setPostDialogOpen(true);
                                                    }}
                                                    className="p-1 rounded hover:bg-gray-100"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setDeletePosts(post);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="p-1 rounded hover:bg-red-100"
                                                >
                                                    <Trash className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">No Data Found.</p>
                        </div>
                    )}
                </div>



            </div>
        </>
    );
}
