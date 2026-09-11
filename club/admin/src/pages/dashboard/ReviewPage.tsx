import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { getReviews, updateReviewStatus } from "@/service/review";
import { setReviewList, setNewReview, setReviewStatus } from "@/redux-toolkit/slice/reviewSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import socket from "@/socket/socket";
import ConfirmCard from "@/components/cards/ConfirmCard";

export default function ReviewPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<"approved" | "rejected">("approved");
  const [adminMessage, setAdminMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const reviewList = useAppSelector((state) => state?.reviews?.reviewsList);

  useEffect(() => {
    socket.on("newReview", (data) => {
      dispatch(setNewReview(data));
    })
    return () => {
      socket.off("newReview")
    }
  }, []);

  const handleGetReview = async () => {
    try {
      const res = await getReviews();

      if (res?.status === 200) {
        dispatch(setReviewList(res?.data?.data));
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (reviewList?.length === 0) {
      handleGetReview();
    }
  }, [reviewList?.length]);

  const handleReviewStatus = async () => {
    try {
      if (!adminMessage.trim()) {
        return toast({ title: "Message Required", description: "Please enter a message", variant: "destructive" });
      }
      setLoading(true);
      const payload = { reviewId: selectedReview?._id, status: selectedStatus, adminReply: adminMessage };
      const res = await updateReviewStatus(payload);

      if (res?.status === 200) {
        toast({ title: selectedStatus === "approved" ? "Review Approved" : "Review Rejected", description: res?.data?.message });
        setStatusDialogOpen(false);
        dispatch(setReviewStatus(payload));
        setAdminMessage("");
        setSelectedReview(null);

      }
    } catch (err) {
      toast({ title: "Update Failed", description: err?.response?.data?.message || err?.message, variant: "destructive", });
    } finally {
      setLoading(false);
      setOpenConfirmDialog(false);
    }
  };

  // USER INITIAL
  const getInitial = (name?: string) => name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <ConfirmCard isOpen={openConfirmDialog} onOpenChange={setOpenConfirmDialog} onConfirm={handleReviewStatus} title={selectedStatus === "approved" ? "Approve Review" : "Reject Review"} description="Are you sure you want to perform this action?" isLoading={loading} buttonName={selectedStatus === "approved" ? "Approve Review" : "Reject Review"} />
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === "approved" ? "Approve Review" : "Reject Review"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="border rounded-xl p-4 bg-muted/40 space-y-4">
              <div className="flex items-center gap-3">
                {selectedReview?.userId?.profileImage ? (
                  <img
                    src={selectedReview?.userId?.profileImage}
                    alt={selectedReview?.userId?.fullName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                    {getInitial(selectedReview?.userId?.fullName)}
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">
                    User Name
                  </p>

                  <p className="font-semibold text-sm">
                    {selectedReview?.userId?.fullName || "Unknown User"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Review Message
                </p>

                <div className="bg-background border rounded-lg p-3 text-sm">
                  {
                    selectedReview?.message
                  }
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {selectedStatus === "approved" ? "Approval Message" : "Rejection Reason"}
              </p>
              <textarea rows={5} value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)}
                placeholder={selectedStatus === "approved" ? "Write approval message..." : "Write rejection reason..."}
                className="w-full border rounded-lg p-3 outline-none resize-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              type="button"
              onClick={() => setOpenConfirmDialog(true)}
              disabled={loading || !adminMessage.trim()}
              className={`w-full ${selectedStatus === "approved" ? "bg-green-600 hover:bg-green-700" : ""}`}
              variant={selectedStatus === "rejected" ? "destructive" : "default"}
            >
              {loading ? "Please wait..." : selectedStatus === "approved" ? "Approve Review" : "Reject Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Reviews</h2>
        </div>

        {reviewList?.length > 0 ? (
          <div className="space-y-4">
            {reviewList.map(
              (item) => {
                const user = item?.userId;

                return (
                  <div key={item?._id} className="border rounded-2xl p-5 bg-card shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">

                        {user?.profileImage ? (
                          <img
                            src={user?.profileImage}
                            alt={user?.fullName}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                            {getInitial(user?.fullName)}
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-sm">{user?.fullName || "Unknown User"}</p>
                          <p className="text-sm text-muted-foreground mt-1"> {item?.message} </p>
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
                      </div>

                      {/* STATUS */}
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full capitalize whitespace-nowrap
                        
                        ${item?.status ===
                            "approved"
                            ? "bg-green-100 text-green-700"

                            : item?.status ===
                              "rejected"
                              ? "bg-red-100 text-red-700"

                              : "bg-yellow-100 text-yellow-700"
                          }
                        
                        `}
                      >
                        {item?.status ||
                          "pending"}
                      </span>
                    </div>

                    {/* ADMIN MESSAGE */}
                    {item?.adminMessage && (
                      <div className="bg-muted/50 border rounded-xl p-4">
                        <p className="text-xs font-semibold text-primary mb-2">
                          Admin Message
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {
                            item?.adminMessage
                          }
                        </p>
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    {/* ACTION BUTTONS */}
                    {item?.status === "pending" && (
                      <div className="flex items-center gap-2 pt-1">

                        {/* APPROVE */}
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedReview(item);

                            setSelectedStatus("approved");

                            setAdminMessage("");

                            setStatusDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />

                          Accept
                        </Button>

                        {/* REJECT */}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            setSelectedReview(item);

                            setSelectedStatus("rejected");

                            setAdminMessage("");

                            setStatusDialogOpen(true);
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />

                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No Reviews Found
          </div>
        )}
      </div>
    </>
  );
}