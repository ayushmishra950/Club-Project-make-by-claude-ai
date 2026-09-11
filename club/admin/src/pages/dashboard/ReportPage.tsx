import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/redux-toolkit/customHook/hook";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import ConfirmCard from "@/components/cards/ConfirmCard";

import {
  getAllReports,
  updateReportStatus,
  deleteReport,
} from "@/service/report";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ReportPage() {
  const { toast } = useToast();
  const  admin = JSON.parse(localStorage.getItem("admin.user"));

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [status, setStatus] = useState<
    "pending" | "reviewed" | "resolved" | "rejected"
  >("reviewed");

  const [actionTaken, setActionTaken] = useState<
    | "none"
    | "warning"
    | "content_removed"
    | "user_blocked"
    | "account_deleted"
  >("none");

  const [adminNote, setAdminNote] = useState("");

  // ======================================
  // Get Reports
  // ======================================

  const handleGetReports = async () => {
    try {
      setLoading(true);

      const res = await getAllReports();

      if (res.status === 200) {
        setReports(res.data.data);
      }
    } catch (err) {
      toast({
        title: "Failed",
        description:
          err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetReports();
  }, []);

  // ======================================
  // Update Report
  // ======================================

  const handleUpdateReport = async () => {
    try {
      if (!selectedReport) return;

      if (!adminNote.trim()) {
        return toast({
          title: "Admin Note Required",
          description: "Please enter admin note.",
          variant: "destructive",
        });
      }

      setLoading(true);

      const payload = {
        status,
        actionTaken,
        adminNote,
      };
 
      const res = await updateReportStatus(
        selectedReport._id,
        admin._id,
        payload
      );

      if (res.status === 200) {
        toast({
          title: "Success",
          description: res.data.message,
        });

        setReports((prev) => prev.map((item) => item._id === selectedReport._id ? res.data.data : item ) );

        setStatusDialogOpen(false);
        setConfirmDialogOpen(false);

        setSelectedReport(null);

        setAdminNote("");

        setStatus("reviewed");

        setActionTaken("none");
      }
    } catch (err) {
      toast({
        title: "Update Failed",
        description:
          err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Delete Report
  // ======================================

  const handleDeleteReport = async () => {
    try {
      if (!selectedReport) return;
     
      setDeleteLoading(true);

      const res = await deleteReport(selectedReport._id);

      if (res.status === 200) {
        toast({
          title: "Deleted",
          description: res.data.message,
        });

        setReports((prev) =>
          prev.filter(
            (item) => item._id !== selectedReport._id
          )
        );

        setDeleteDialogOpen(false);

        setSelectedReport(null);
      }
    } catch (err) {
      toast({
        title: "Delete Failed",
        description:
          err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ======================================
  // User Initial
  // ======================================

  const getInitial = (name?: string) =>
    name?.charAt(0)?.toUpperCase() || "U";

  // RETURN
  return (
  <>
    {/* UPDATE CONFIRM */}
    <ConfirmCard
      isOpen={confirmDialogOpen}
      onOpenChange={setConfirmDialogOpen}
      onConfirm={handleUpdateReport}
      title="Update Report"
      description="Are you sure you want to update this report?"
      isLoading={loading}
      buttonName="Update Report"
    />
     <ConfirmCard
      isOpen={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      onConfirm={handleDeleteReport}
      title="Delete Report"
      description="Are you sure you want to Delete this report?"
      isLoading={loading}
      buttonName="Delete"
    />

    {/* UPDATE DIALOG */}

    <Dialog
      open={statusDialogOpen}
      onOpenChange={setStatusDialogOpen}
    >
      <DialogContent className="sm:max-w-xl">

        <DialogHeader>
          <DialogTitle>
            Update Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">

          {/* Reporter */}

          <div className="border rounded-xl p-4 bg-muted/40">

            <p className="text-xs text-muted-foreground mb-3">
              Reported By
            </p>

            <div className="flex items-center gap-3">

              {selectedReport?.reportedBy?.profileImage ? (
                <img
                  src={selectedReport?.reportedBy?.profileImage}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  {getInitial(selectedReport?.reportedBy?.fullName)}
                </div>
              )}

              <div>
                <p className="font-semibold">
                  {selectedReport?.reportedBy?.fullName}
                </p>

                <p className="text-sm text-muted-foreground">
                  {selectedReport?.reportedBy?.email}
                </p>
              </div>

            </div>

          </div>

          {/* Reported User */}

          {selectedReport?.reportedUser && (

            <div className="border rounded-xl p-4 bg-muted/40">

              <p className="text-xs text-muted-foreground mb-3">
                Reported User
              </p>

              <div className="flex items-center gap-3">

                {selectedReport?.reportedUser?.profileImage ? (
                  <img
                    src={selectedReport?.reportedUser?.profileImage}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                    {getInitial(selectedReport?.reportedUser?.fullName)}
                  </div>
                )}

                <div>

                  <p className="font-semibold">
                    {selectedReport?.reportedUser?.fullName}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {selectedReport?.reportedUser?.email}
                  </p>

                </div>

              </div>

            </div>

          )}

          {/* Status */}

          <div>

            <p className="text-sm font-medium mb-2">
              Status
            </p>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "pending" | "reviewed" | "resolved" | "rejected")}
              className="w-full border rounded-lg p-3 bg-background"
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

          </div>

          {/* Action */}

          <div>

            <p className="text-sm font-medium mb-2">
              Action Taken
            </p>

            <select
              value={actionTaken}
              onChange={(e) =>
                setActionTaken(e.target.value as  "none" | "warning" | "content_removed" | "user_blocked" | "account_deleted")
              }
              className="w-full border rounded-lg p-3 bg-background"
            >
              <option value="none">None</option>
              <option value="warning">Warning</option>
              <option value="content_removed">
                Content Removed
              </option>
              <option value="user_blocked">
                User Blocked
              </option>
              <option value="account_deleted">
                Account Deleted
              </option>
            </select>

          </div>

          {/* Admin Note */}

          <div>

            <p className="text-sm font-medium mb-2">
              Admin Note
            </p>

            <textarea
              rows={5}
              value={adminNote}
              onChange={(e) =>
                setAdminNote(e.target.value)
              }
              className="w-full border rounded-lg p-3 resize-none outline-none focus:ring-2 focus:ring-primary"
              placeholder="Write admin note..."
            />

          </div>

          <Button
            className="w-full"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Update Report"}
          </Button>

        </div>

      </DialogContent>

    </Dialog>

    {/* PAGE */}

    <div className="space-y-5">

      <div className="flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          All Reports
        </h2>

      </div>

      {reports.length > 0 ? (

        <div className="space-y-4">

          {reports.map((item) => (

            <div
              key={item._id}
              className="border rounded-2xl bg-card shadow-sm p-5 space-y-5"
            >

              <div className="flex justify-between items-start gap-4">

                <div>

                  <p className="font-semibold">
                    {item.reportedBy?.fullName}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {item.reportedBy?.email}
                  </p>

                  <div className="mt-3 space-y-2 text-sm">

                    <p>
                      <span className="font-medium">
                        Report Type :
                      </span>{" "}
                      {item.reportType}
                    </p>

                    <p>
                      <span className="font-medium">
                        Reason :
                      </span>{" "}
                      {item.reason}
                    </p>

                    {item.description && (

                      <p>

                        <span className="font-medium">
                          Description :
                        </span>{" "}
                        {item.description}

                      </p>

                    )}

                    {item.reportedUser && (

                      <p>

                        <span className="font-medium">
                          Against :
                        </span>{" "}
                        {item.reportedUser.fullName}

                      </p>

                    )}

                  </div>

                </div>

                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full capitalize

                  ${
                    item.status === "resolved"
                      ? "bg-green-100 text-green-700"
                      : item.status === "reviewed"
                      ? "bg-blue-100 text-blue-700"
                      : item.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                  `}
                >
                  {item.status}
                </span>

              </div>

              {item.adminNote && (

                <div className="bg-muted/50 border rounded-xl p-4">

                  <p className="text-xs font-semibold text-primary mb-2">
                    Admin Note
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {item.adminNote}
                  </p>

                </div>

              )}

              <div className="flex gap-2">

                <Button
                  onClick={() => {

                    setSelectedReport(item);

                    setStatus(item.status);

                    setActionTaken(item.actionTaken);

                    setAdminNote(item.adminNote || "");

                    setStatusDialogOpen(true);

                  }}
                >
                  Update
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => { setSelectedReport(item); setDeleteDialogOpen(true);}}>
                {deleteLoading ? <Loader2 className="animate-spin" /> : "  Delete"}
                </Button>

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No Reports Found
        </div>

      )}

    </div>
  </>
);

}
