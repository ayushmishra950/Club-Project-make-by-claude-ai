import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { acceptPaymentRequest } from "@/service/auth";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/redux-toolkit/customHook/hook";
import { setUpdateUser } from "@/redux-toolkit/slice/userSlice";
import { useEffect, useState } from "react";


export default function PaymentDetailCard({ paymentDialog, setPaymentDialog, selectedPayment }) {

    const { toast } = useToast();
    const dispatch = useAppDispatch();
    const [amount, setAmount] = useState<string | undefined>(selectedPayment?.amount);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (paymentDialog && selectedPayment?.amount) {
            setAmount(selectedPayment?.amount);
        }
    }, [selectedPayment, paymentDialog]);

    const handleAcceptPayment = async () => {
        if (!selectedPayment?._id) return;
        const obj = { id: selectedPayment?._id, amount: amount }
        try {
            setLoading(true);
            const res = await acceptPaymentRequest(obj);
            if (res.status === 200) {
                toast({ title: "Payment Accepted.", description: res?.data?.message });
                dispatch(setUpdateUser(res?.data?.user));
                setPaymentDialog(false);
            }
        }
        catch (err) {
            toast({ title: "Accept payment failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
        }
        finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
            <DialogContent className="max-w-md">

                <DialogHeader>
                    <DialogTitle>Payment Verification</DialogTitle>
                </DialogHeader>

                {/* Image Preview */}
                {selectedPayment?.paymentImage && (
                    <div className="flex justify-center">
                        <img
                            src={selectedPayment.paymentImage}
                            alt="payment"
                            className="w-40 h-40 object-cover rounded-md border"
                        />
                    </div>
                )}

                <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Amount Number</p>

                    <input
                        type="number"
                        value={amount}
                        disabled={selectedPayment?.premiumUser === "premium"}
                        onChange={(e) => { setAmount(e.target.value) }}
                        className="font-semibold bg-transparent outline-none border-none w-full text-foreground"
                    />
                </div>

                {selectedPayment?.transitionNumber && <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Transaction Number</p>
                    <p className="font-semibold">
                        {selectedPayment?.transitionNumber || "N/A"}
                    </p>
                </div>}

                <Button
                    className="w-full mt-4"
                    onClick={
                        selectedPayment?.premiumUser === "premium"
                            ? undefined
                            :
                            handleAcceptPayment
                    }
                    disabled={selectedPayment?.premiumUser === "premium" || loading}
                >
                    {loading ? "Loading..." : selectedPayment?.premiumUser === "premium"
                        ? "Payment Approved (Premium)"
                        : "Accept"}
                </Button>

            </DialogContent>
        </Dialog>
    );
};