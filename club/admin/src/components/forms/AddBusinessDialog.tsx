import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { getAllUser, addBusinessUser } from "@/service/auth";
import { setUserList } from "@/redux-toolkit/slice/userSlice";
import { useToast } from "@/hooks/use-toast";

export default function AddBusinessDialog({ open, onOpenChange }: any) {
    const { toast } = useToast();
    const dispatch = useAppDispatch();
    const [selectedUser, setSelectedUser] = useState("");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("active");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const users = useAppSelector((state) => state?.user?.userList);

    useEffect(() => {
        const user = users.find((u: any) => u._id === selectedUser);

        if (user?.businesses?.length) {
            // Clone the businesses to avoid direct mutation
            setBusinesses(user.businesses.map((b: any) => ({ ...b })));
        } else {
            setBusinesses([
                {
                    businessName: "",
                    businessCategory: "",
                    businessDescription: "",
                    website: "",
                    businessPhone: "",
                    businessAddress: "",
                    workingHours: "",
                    businessCoverImage: "",
                    bannerPosition: "center",
                    isVerified: "pending",
                },
            ]);
        }
    }, [selectedUser]);

    const addBusiness = () => {
        setBusinesses((prev) => [
            ...prev,
            {
                businessName: "",
                businessCategory: "",
                businessDescription: "",
                website: "",
                businessPhone: "",
                businessAddress: "",
                workingHours: "",
                businessCoverImage: "",
                bannerPosition: "center",
                isVerified: "pending",
            },
        ]);
    };

    const removeBusiness = (index: number) => {
        setBusinesses((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: string, value: any) => {
        setBusinesses((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSubmit = async () => {
        try {
            const filtered = businesses.filter(
                (b: any) => b.businessName?.trim() !== ""
            );
            if (!selectedUser) {
                toast({ title: "Select User", description: "Please select a user", variant: "destructive" })
                return;
            };
            if (filtered.length === 0) {
                toast({ title: "Add Business", description: "Add Businesses", variant: "destructive" })
                return;
            }
            setLoading(true);

            const formData = new FormData();
            formData.append("userId", selectedUser);

            // Send businesses as a JSON string
            // We'll strip the file objects from this JSON and handle them separately
            const businessesData = filtered.map((b: any, index: number) => {
                const { businessCoverImage, ...rest } = b;
                if (businessCoverImage instanceof File) {
                    formData.append(`businessCoverImage_${index}`, businessCoverImage);
                }
                return rest;
            });

            formData.append("businesses", JSON.stringify(businessesData));

            const res = await addBusinessUser(formData);
            if (res.status === 200) {
                toast({ title: "Business Added", description: "Business added successfully", variant: "default" })
                onOpenChange(false);
            }

        } catch (err) {
            toast({ title: "Add Business Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
        }
        finally {
            setLoading(false);
        }
    };

    const handleGetUsers = async () => {
        try {
            const res = await getAllUser({ page, perPage, search, filterStatus });
            if (res.status === 200) {
                dispatch(setUserList(res?.data?.users));
                setTotalPages(Math.ceil(res?.data?.total / perPage));
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    useEffect(() => {
        if (page || perPage || search || filterStatus) { handleGetUsers() };
    }, [page, perPage, search, filterStatus]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle> Add Business </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* USER SELECT WITH SEARCH */}
                    <div className="space-y-2">
                        <Label>Select User</Label>

                        <div className="relative">
                            <Input
                                placeholder="Search user by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            {/* DROPDOWN LIST */}
                            {search.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border rounded-md bg-white shadow-md">
                                    {users
                                        .filter((user: any) =>
                                            user.fullName
                                                .toLowerCase()
                                                .includes(search.toLowerCase())
                                        )
                                        .map((user: any) => (
                                            <div
                                                key={user._id}
                                                onClick={() => {
                                                    setSelectedUser(user._id);
                                                    setSearch(user.fullName);
                                                }}
                                                className="p-2 cursor-pointer hover:bg-muted text-sm"
                                            >
                                                {user.fullName}
                                            </div>
                                        ))}

                                    {/* NO RESULT */}
                                    {users.filter((user: any) =>
                                        user.fullName
                                            .toLowerCase()
                                            .includes(search.toLowerCase())
                                    ).length === 0 && (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                No user found
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedUser && businesses.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            Total Businesses:{" "} {businesses.length}
                        </div>
                    )}

                    <div className="space-y-4">
                        {businesses.map(
                            (biz, index) => (
                                <div key={index} className="border rounded-xl p-4 space-y-3 bg-muted/30">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-sm"> Business {index + 1}</p>
                                        {businesses.length > 1 && (
                                            <button onClick={() => removeBusiness(index)} className="text-red-500">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div>
                                        <Label> Business Name </Label>
                                        <Input value={biz.businessName} onChange={(e) => handleChange(index, "businessName", e.target.value)} />
                                    </div>

                                    <div>
                                        <Label> Category  </Label>
                                        <Input value={biz.businessCategory} onChange={(e) => handleChange(index, "businessCategory", e.target.value)} />
                                    </div>

                                    <div>
                                        <Label> Description </Label>
                                        <Textarea value={biz.businessDescription} onChange={(e) => handleChange(index, "businessDescription", e.target.value)} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label> Phone</Label>
                                            <Input value={biz.businessPhone} onChange={(e) => handleChange(index, "businessPhone", e.target.value)} />
                                        </div>

                                        <div>
                                            <Label> Website </Label>
                                            <Input value={biz.website} onChange={(e) => handleChange(index, "website", e.target.value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <Label> Address </Label>
                                        <Input value={biz.businessAddress} onChange={(e) => handleChange(index, "businessAddress", e.target.value)} />
                                    </div>

                                    <div>
                                        <Label> Working Hours </Label>
                                        <Input
                                            value={biz.workingHours}
                                            onChange={(e) => handleChange(index, "workingHours", e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label> Banner Position </Label>
                                                <select
                                                    value={biz.bannerPosition}
                                                    onChange={(e) => handleChange(index, "bannerPosition", e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="center">Center (Top)</option>
                                                    <option value="left">Left Vertical</option>
                                                    <option value="right">Right Vertical</option>
                                                </select>
                                                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                                                    {biz.bannerPosition === 'center' 
                                                        ? "Recommended: 1200 x 400px (Wide)" 
                                                        : "Recommended: 400 x 800px (Vertical)"}
                                                </p>
                                            </div>

                                            <div>
                                                <Label> Business Cover Image </Label>
                                                <Input
                                                    type="file"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            handleChange(index, "businessCoverImage", file);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* IMAGE PREVIEW - SMALL SIZE */}
                                        {biz.businessCoverImage && (
                                            <div className="relative rounded-lg overflow-hidden border bg-muted w-32 h-20 flex items-center justify-center group/preview">
                                                <img 
                                                    src={biz.businessCoverImage instanceof File 
                                                        ? URL.createObjectURL(biz.businessCoverImage) 
                                                        : biz.businessCoverImage} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button 
                                                        variant="destructive" 
                                                        size="icon" 
                                                        className="h-7 w-7"
                                                        onClick={() => handleChange(index, "businessCoverImage", "")}
                                                    >
                                                        <Trash className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* ADD MORE BUTTON */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addBusiness}
                        className="w-full"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Business
                    </Button>

                    {/* SUBMIT */}
                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={!selectedUser || loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Businesses"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}