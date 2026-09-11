import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmCardProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading?: boolean;
    buttonName?: string;
    title?: string;
    description?: string;
    onConfirm?: (e: React.FormEvent) => void;
}

const ConfirmCard = ({ isOpen, onOpenChange, isLoading = false, buttonName = "Confirm", title = "Confirm", description = "Are you sure you want to confirm this item? This action cannot be undone.", onConfirm }: ConfirmCardProps) => {

    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-[200px] max-h-[300px] flex flex-col justify-between">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                {/* Centered description */}
                <div className="flex-grow flex  px-4">
                    <p className="text-sm text-gray-600">{description}</p>
                </div>

                <DialogFooter className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        {isLoading ? "Deleting..." : buttonName}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmCard;