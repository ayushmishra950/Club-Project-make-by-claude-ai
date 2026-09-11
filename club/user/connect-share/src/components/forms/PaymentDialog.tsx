import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState, useRef } from "react";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { convertPremiumUser } from "@/service/auth";
import { useAppDispatch } from "@/redux-toolkit/customHook/hook";
import { setUserData } from "@/redux-toolkit/slice/userSlice";

export default function PaymentDialog({ open, setOpen }) {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("member.user") || "{}");

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();


  const fileRef = useRef(null);
  const resetForm = () => {
    setImage(null);
    setPreview(null);
    setNumber("");
    setAmount("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Remove image
  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) {
      fileRef.current.value = null;
    }
  };

  const handleSubmit = async () => {

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("userId", user?._id);
      formData.append("paymentImage", image);
      formData.append("amount", amount);
      formData.append("transitionNumber", number);

      const res = await convertPremiumUser(formData);
      if (res.status === 200) {
        toast({ title: "User converted to premium successfully.", description: res?.data?.message });
        setOpen(false);
        resetForm();
        dispatch(setUserData(res?.data?.data));
      }

    } catch (err) {
      toast({ title: "Failed to convert user to premium.", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>

        <DialogHeader>
          <DialogTitle>Payment Confirmation</DialogTitle>
          <DialogDescription>
            Add Screenshot and Enter Your Transition Number
          </DialogDescription>
        </DialogHeader>

        {/* Image Upload */}
        <div>
          <Label>Upload Image</Label>
          <Input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleImageChange}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div style={{ position: "relative", width: "100px", marginTop: "10px" }}>
            <img
              src={preview}
              alt="preview"
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                borderRadius: "8px"
              }}
            />
            <button
              onClick={removeImage}
              style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                background: "red",
                borderRadius: "50%",
                border: "none",
                color: "white",
                cursor: "pointer"
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Amount Input */}
        <div style={{ marginTop: "10px" }}>
          <Label>Amount</Label>
          <Input
            type="number"
            placeholder="Enter amount..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Number Input */}
        <div style={{ marginTop: "10px" }}>
          <Label>Transaction Number</Label>
          <Input
            type="number"
            placeholder="Enter transaction number..."
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={loading || !number || !image || !amount} >
          {loading && <Loader2 className="animate-spin mr-2" size={16} />}
          Submit
        </Button>

      </DialogContent>
    </Dialog>
  );
}