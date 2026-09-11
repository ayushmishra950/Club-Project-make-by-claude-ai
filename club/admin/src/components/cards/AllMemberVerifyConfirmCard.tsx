
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux-toolkit/customHook/hook";
import { useEffect } from "react";

interface ConfirmCardProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading?: boolean;
    buttonName?: string;
    title?: string;
    description?: string;
    onConfirm?: (e: React.FormEvent) => void;
    users?: string[];
    onRemoveUser?: React.Dispatch<React.SetStateAction<string[]>>;
}

const ConfirmCard = ({
    isOpen,
    onOpenChange,
    isLoading = false,
    buttonName = "Confirm",
    title = "Confirm",
    description = "Are you sure you want to confirm this item? This action cannot be undone.",
    onConfirm,
    users = [],
    onRemoveUser,
}: ConfirmCardProps) => {
    const memberList = useAppSelector((state) => state?.user?.userList);
    const selectedUsers = memberList?.filter((member) => users?.includes(member?._id));

    useEffect(() => {
        if (isOpen && selectedUsers?.length === 0) {
            onOpenChange(false);
        }
    }, [selectedUsers?.length, isOpen]);

    const handleRemoveUser = (id: string) => {
        if (!onRemoveUser) return;
        onRemoveUser((prev) => prev.filter((userId) => userId !== id));
    };

    if (!isOpen || selectedUsers?.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-xl font-semibold">
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 px-6 py-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>

                    <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                        {selectedUsers.map((member) => (
                            <div key={member?._id} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <img src={member?.profileImage} alt={member?.fullName} className="h-11 w-11 rounded-full border object-cover" />

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {member?.fullName}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Member
                                        </p>
                                    </div>
                                </div>

                                <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveUser(member?._id)}>
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOOTER */}
                <DialogFooter className="flex-row justify-end gap-2 border-t px-6 py-4">

                    <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>

                    <Button type="button" onClick={onConfirm} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                        {isLoading ? "Processing..." : buttonName}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmCard;