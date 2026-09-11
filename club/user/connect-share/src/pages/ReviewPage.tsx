import { useEffect, useState } from "react";
import { MessageSquare, Send, Loader2, ArrowLeft } from "lucide-react";
import { addReviews, getReviews } from "@/service/review";
import { useToast } from "@/hooks/use-toast";
import ConfirmCard from "@/components/card/ConfirmCard";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setNewReview, setReviewList } from "@/redux-toolkit/slice/reviewSlice";
import { useNavigate } from "react-router-dom";
import socket from "@/socket/socket";

export default function ReviewPage() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [rating, setRating] = useState(0);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem("member.user"));
    const dispatch = useAppDispatch();
    const reviews = useAppSelector((state) => state?.reviews?.reviewsList);
    

    useEffect(() => {
        socket.on("updateReview", (data) => {
            console.log("updateReview", data);
            dispatch(setNewReview(data));
        });

        return () => {
            socket.off("updateReview");
        }
    }, [])

    const handleSubmit = async() => {
        if (!text.trim() && !user?._id) return;
        const obj = {
            userId: user?._id,
            message: text,
            rating,
        };
        try {
            setIsLoading(true);
            const res = await addReviews(obj);
            console.log(res);
            if (res.status === 201) {
                toast({ title: "Review send successfully.", description: res?.data?.message });
                dispatch(setNewReview(res?.data?.review));
                setConfirmDialogOpen(false);
                setText("");
            }
        } catch (error) {
            console.log(error);
            toast({ title: "Review send failed.", description: error?.response?.data?.message || error?.message, variant: "destructive" })
        }
        finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
                return "bg-green-100 text-green-600";
            case "rejected":
                return "bg-red-100 text-red-600";
            default:
                return "bg-yellow-100 text-yellow-600";
        }
    };

    const getAllReviews = async () => {
        try {
            const res = await getReviews(user._id);
            console.log(res);
            if (res.status === 200) {
                dispatch(setReviewList(res?.data?.reviews));
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (reviews?.length === 0 && user._id) {
            getAllReviews();
        }
    }, [user._id, reviews?.length]);

    return (
        <>
            <ConfirmCard
                isOpen={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                isLoading={isLoading}
                buttonName={"send"}
                title="send review"
                description={`are you sure you want to send this review?`}
                onConfirm={handleSubmit}
            />
            <div className="min-h-screen w-full bg-background">

                {/* HEADER */}
                <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">

                    {/* BACK BUTTON */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-muted transition"
                    >
                        <ArrowLeft className="h-5 w-5 text-foreground" />
                    </button>

                    <MessageSquare className="h-5 w-5 text-primary" />

                    <h1 className="text-lg font-semibold">My Reviews</h1>
                </div>

                {/* PAGE CONTENT */}
                <div className="max-w-3xl mx-auto px-4 py-5 space-y-6">

                    {/* INPUT SECTION */}
                    <div className="flex gap-2 bg-muted/30 p-3 rounded-xl border">
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Write your review..."
                            className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            placeholder="Rating (1-5)"
                            className="w-28 px-3 py-2 text-sm rounded-lg border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                        />

                        <button
                            onClick={() => setConfirmDialogOpen(true)}
                            disabled={isLoading || !text.trim()}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm flex items-center gap-2 hover:opacity-90"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Send
                        </button>
                    </div>

                    {/* LIST */}
                    <div className="space-y-4">

                        {reviews?.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                No reviews submitted yet
                            </div>
                        ) : (
                            reviews.map((item) => (
                                <div
                                    key={item._id}
                                    className="border-b pb-4 space-y-2"
                                >
                                    {/* REVIEW + STATUS */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-foreground leading-relaxed">
                                                {item.message}
                                            </p>

                                            <div className="flex items-center gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span
                                                        key={star}
                                                        className={
                                                            star <= item?.rating
                                                                ? "text-yellow-500"
                                                                : "text-gray-300"
                                                        }
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <span
                                            className={`text-[10px] px-2 py-1 rounded-full font-medium ${getStatusColor(
                                                item.status
                                            )}`}
                                        >
                                            {item.status}
                                        </span>
                                    </div>

                                    {/* ADMIN REPLY */}
                                    {item.adminReply && (
                                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                            <p className="text-xs font-semibold text-blue-700 mb-1">
                                                Admin Reply
                                            </p>
                                            <p className="text-xs text-blue-800">
                                                {item.adminReply}
                                            </p>
                                        </div>
                                    )}

                                    {/* DATE */}
                                    <p className="text-[11px] text-muted-foreground">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}