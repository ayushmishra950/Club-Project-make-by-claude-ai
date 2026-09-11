import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { addDonation } from "@/service/donation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectValue, SelectItem, SelectTrigger } from "@/components/ui/select";


const DonateDialog = ({ isOpen, onOpenChange, initialData, setUserListRefresh }) => {
    const [formData, setFormData] = useState<any>({});
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                userId: initialData?._id,
                name: initialData?.fullName,
                email: initialData?.email,
            })
        }
    }, [initialData]);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const res = await addDonation(formData);
            if (res.status === 201) {
                toast({ title: "Add Donation", description: res.data.message })
                setUserListRefresh(true);
                onOpenChange(false);
                setFormData({})
            }
        }
        catch (err) {
            console.log(err)
            toast({ title: "Add Donation Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
        }
        finally {
            setIsLoading(false);

        }
    }
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle> Donation Card</DialogTitle>
                        <DialogDescription>Donation</DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label>Name</Label>
                        <Input name="name" type="text" disabled value={formData?.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }) }} />

                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input name="email" type="email" disabled value={formData?.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }) }} />
                    </div>
                    <div>
                        <Label>Donation Title</Label>
                        <Select value={formData?.title || "all"} onValueChange={(value) => { setFormData({ ...formData, title: value }) }} >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="temple">Temple</SelectItem>
                                <SelectItem value="food">Food Donation</SelectItem>
                                <SelectItem value="charity">Charity</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Donate Amount</Label>
                        <Input name="amount" type="text" value={formData?.amount} onChange={(e) => { setFormData({ ...formData, amount: e.target.value }) }} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            onClick={() => { onOpenChange(false) }}
                            className="bg-gray-200 text-black hover:bg-gray-300"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-blue-500 text-white hover:bg-blue-600"
                        >
                            {isLoading && <Loader2 className="animate-spin w-2 h-2" />}
                            {isLoading ? "Submiting..." : "Submit"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
};


export default DonateDialog;