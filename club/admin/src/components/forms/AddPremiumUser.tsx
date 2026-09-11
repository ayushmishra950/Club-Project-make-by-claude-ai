
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Loader2, X } from "lucide-react";
import { adminConvertPremiumUser } from "@/service/auth";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/redux-toolkit/customHook/hook";
import { setUpdateUser } from "@/redux-toolkit/slice/userSlice";

type PaymentProofDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: any;
};

const AddPremiumUser = ({ open, onOpenChange, initialData }: PaymentProofDialogProps) => {
    const { toast } = useToast();
    const dispatch = useAppDispatch();
    const [fullName, setFullName] = useState("");
    const [amount, setAmount] = useState("");
    const [transactionNumber, setTransactionNumber] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setFullName(initialData?.fullName || "");
        }
    }, [open, initialData]);

    // Handle Screenshot Upload
    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (file) {
            setScreenshot(file);

            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
        }
    };

    // Remove Selected Image
    const handleRemoveImage = () => {
        setScreenshot(null);
        setPreview("");
    };

    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !amount || !screenshot) {
            toast({ title: "Please fill all required fields", description: "fullName, amount and screenshot are required." })
            return;
        }
        const form = new FormData();
        form.append("userId", initialData?._id);
        form.append("amount", amount);
        form.append("transactionNumber", transactionNumber);
        form.append("screenshot", screenshot);

        setLoading(true);

        try {
            const res = await adminConvertPremiumUser(form);
            console.log("Response", res);
            if (res.status === 200) {
                toast({ title: "Premium user added successfully", description: "Premium user added successfully" })
                dispatch(setUpdateUser(res?.data?.user));
                setAmount("");
                setTransactionNumber("");
                setScreenshot(null);
                setPreview("");
                onOpenChange(false);
            }
        }
        catch (err) {
            console.log("Error", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] max-w-[420px] rounded-xl border-border bg-card text-card-foreground shadow-card p-4 sm:p-5 max-h-[90vh] overflow-y-auto no-scrollbar" >
                <DialogHeader className="space-y-1">
                    <DialogTitle className=" text-lg sm:text-xl font-display font-bold text-foreground" >
                        Upload Payment Proof
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-3 mt-2"
                >
                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-sm font-medium text-foreground" >
                            Full Name *
                        </Label>

                        <Input
                            id="fullName"
                            type="text"
                            placeholder="Enter full name"
                            value={fullName}
                            disabled
                            onChange={(e) =>
                                setFullName(e.target.value)
                            }
                            className=" h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <Label htmlFor="amount" className="text-sm font-medium text-foreground" >
                            Amount *
                        </Label>

                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) =>
                                setAmount(e.target.value)
                            }
                            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Transaction Number */}
                    <div className="space-y-1.5">
                        <Label htmlFor="transactionNumber" className="text-sm font-medium text-foreground" >
                            Transaction Number

                            <span className="ml-1 text-xs text-muted-foreground">
                                (Optional)
                            </span>
                        </Label>

                        <Input
                            id="transactionNumber"
                            type="text"
                            placeholder="Enter transaction number"
                            value={transactionNumber}
                            onChange={(e) =>
                                setTransactionNumber(
                                    e.target.value
                                )
                            }
                            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Upload Screenshot */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="screenshot"
                            className="text-sm font-medium text-foreground"
                        >
                            Upload Screenshot *
                        </Label>

                        <Input
                            id="screenshot"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="h-10 border-border bg-background text-foreground file:text-foreground"
                        />
                    </div>

                    {/* Screenshot Preview */}
                    {preview && (
                        <div className="flex justify-center mt-1">
                            <div className="relative">
                                {/* Remove Button */}
                                <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-destructive text-destructive-foreground shadow-md transition-all hover:scale-105" >
                                    <X className="h-3.5 w-3.5" />
                                </button>

                                {/* Image */}
                                <div className="overflow-hidden rounded-lg border border-border bg-muted p-1 shadow-card">
                                    <img src={preview} alt="Screenshot Preview" className=" h-20 w-20 rounded-md object-cover" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button type="submit" disabled={loading || !screenshot || !initialData?._id || !amount} className="mt-1 w-full rounded-lg py-2.5 text-sm font-semibold font-display transition-all gradient-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Add Premium User"}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPremiumUser;