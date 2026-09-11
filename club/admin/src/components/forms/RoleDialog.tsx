import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import {roleAssign} from "@/service/role";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import  {Select, SelectContent, SelectValue, SelectItem, SelectTrigger} from "@/components/ui/select";

const RoleDialog = ({ isOpen, onOpenChange, initialData, setMemberListRefresh }) => {
    const [formData, setFormData] = useState<any>({});
    const {toast} = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(()=>{
          if(initialData){
            setFormData({
                userId:initialData?._id,
                name:initialData?.fullName,
                email:initialData?.email,
                role:initialData?.role
            })
          }
    }, [initialData]);

    const handleSubmit = async() => {
        
        try{
            setIsLoading(true);
          const res =await roleAssign(formData);
          if(res.status===200){
            toast({title:"Role Updated Successfully.", description:res.data.message})
            setMemberListRefresh(true);
             onOpenChange(false);
            setFormData({})
          }
        }
        catch(err){
          toast({title:"Role Update Failed.", description:err?.response?.data?.message|| err?.message, variant:"destructive"})
        }
        finally{
            setIsLoading(false);
           
        }
    }
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Role Assign Card</DialogTitle>
                        <DialogDescription>Role Assign</DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label>Name</Label>
                        <Input name="name" type="text" disabled value={formData?.name} onChange={(e)=>{setFormData({...formData, name:e.target.value})}} />

                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input name="email" type="email" disabled value={formData?.email} onChange={(e)=>{setFormData({...formData, email: e.target.value})}} />
                    </div>
                    <div>
                        <Label>Role</Label>
                        <Select value={formData?.role} onValueChange={(value)=>{setFormData({...formData, role:value})}}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">user</SelectItem>
                                <SelectItem value="secretary">Secretary</SelectItem>
                                <SelectItem value="treasurer">Treasurer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            onClick={()=>{onOpenChange(false)}}
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


export default RoleDialog;