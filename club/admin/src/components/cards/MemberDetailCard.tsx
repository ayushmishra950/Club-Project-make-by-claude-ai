
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

const MemberDetailCard = ({ member, detailDialogOpen, setDetailDialogOpen }: any) => {
  if (!member) return null;
  console.log(member);
  // ================= SAFE NORMALIZATION =================
  const user = {
    fullName: member?.fullName || member?.personalDetails?.fullName,
    email: member?.email || member?.personalDetails?.email,
    mobile: member?.mobile || member?.personalDetails?.mobile,
    occupation: member?.occupation || member?.personalDetails?.occupation,
    address: member?.address || member?.personalDetails?.address,
    state: member?.state || member?.personalDetails?.state,
    country: member?.country || member?.personalDetails?.country,
    dob: member?.dob,
    spouseName: member?.spouseName,
    spouseEmail: member?.spouseEmail,
    spouseMobile: member?.spouseMobile,
    spouseOccupation: member?.spouseOccupation,
    spouseDob: member?.spouseDob,
    children: member?.children || []
  };

  const badgeLabel = member?.blocked ? "Blocked" : !member?.isVerified ? "Unverified" : "Active";

  const accountType =
    member?.accountType || member?.type || member?.role;

  const isBusiness = accountType?.toString().toLowerCase() === "business" || (member?.businesses && member.businesses.length > 0);


  return (
    <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] flex flex-col gap-4 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">

            {/* ================= PROFILE ================= */}
            <div className="space-y-4 text-center">
              {member?.profileImage ? (
                <img
                  src={member.profileImage}
                  alt={user.fullName || "Member"}
                  className="mx-auto h-40 w-40 rounded-full object-cover border"
                />
              ) : (
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-muted text-3xl font-bold text-muted-foreground">
                  {user.fullName ?.split(" ") ?.map((n: string) => n[0]) ?.join("")}
                </div>
              )}

              <div className="flex justify-center">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {badgeLabel}
                </span>
              </div>
            </div>

            {/* ================= DETAILS ================= */}
            <div className="space-y-6">

              <div>
                <h3 className="text-xl font-semibold">{user.fullName}</h3>
                <p className="text-sm text-muted-foreground">
                  {user.occupation || "Member"}
                </p>
              </div>

              {/* BASIC INFO */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">User ID</p>
                  <p className="font-medium">{member.userId || member._id}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email || "N/A"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.mobile || "N/A"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    City / State
                  </p>
                  <p className="font-medium">
                    {user.state || "N/A"}, {user.country || "N/A"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Address</p>
                  <p className="font-medium">{user.address || "N/A"}</p>
                </div>
              </div>

              {/* PERSONAL INFO */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">DOB</p>
                  <p className="font-medium">
                    {user.dob
                      ? new Date(user.dob).toLocaleDateString("en-IN")
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Joined
                  </p>
                  <p className="font-medium">
                    {member.createdAt
                      ? new Date(member.createdAt).toLocaleString("en-IN")
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* ================= BUSINESS ================= */}
            {/* ================= BUSINESS ================= */}
{isBusiness && member?.businesses?.length > 0 && (
  <div className="rounded-3xl border bg-slate-50 p-4">
    <h4 className="font-semibold">Business Information</h4>

    <div className="mt-4 space-y-4">
      {member.businesses.map((business: any, index: number) => (
        <div
          key={index}
          className="border bg-white rounded-xl p-4 space-y-2"
        >
          <p className="text-sm font-semibold text-gray-700">
            Business {index + 1}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Business Name
              </p>
              <p className="font-medium">
                {business.businessName || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Category
              </p>
              <p className="font-medium">
                {business.businessCategory || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Phone
              </p>
              <p className="font-medium">
                {business.businessPhone || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Website
              </p>
              <p className="font-medium break-all">
                {business.website || "N/A"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">
                Address
              </p>
              <p className="font-medium">
                {business.businessAddress || "N/A"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">
                Working Hours
              </p>
              <p className="font-medium">
                {business.workingHours || "N/A"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">
                Description
              </p>
              <p className="font-medium">
                {business.businessDescription || "N/A"}
              </p>
            </div>

          </div>
        </div>
      ))}
    </div>
  </div>
)}

              {/* ================= FAMILY ================= */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Spouse Name
                  </p>
                  <p className="font-medium">{user.spouseName || "N/A"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Spouse Email
                  </p>
                  <p className="font-medium">{user.spouseEmail || "N/A"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Spouse Phone
                  </p>
                  <p className="font-medium">{user.spouseMobile || "N/A"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Spouse Occupation
                  </p>
                  <p className="font-medium">{user.spouseOccupation || "N/A"}</p>
                </div>
              </div>

              {/* ================= CHILDREN ================= */}
              {user.children?.length > 0 && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-2">
                    Children
                  </p>

                  <div className="space-y-2">
                    {user.children.map((child: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between bg-white border p-2 rounded"
                      >
                        <span>{child.name}</span>
                        <span>{child.age} yrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= OTHER INFO ================= */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Premium
                  </p>
                  <p className="font-medium">
                    {member.premiumUser === "premium"
                      ? "Premium User"
                      : "No Premium"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Last Seen
                  </p>
                  <p className="font-medium">
                    {member.lastSeen
                      ? new Date(member.lastSeen).toLocaleString("en-IN")
                      : "N/A"}
                  </p>
                </div>
              </div>

              <Button className="w-full" onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailCard;
