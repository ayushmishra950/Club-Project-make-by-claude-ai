import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Building, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateUserByAdmin } from "@/service/auth";
import { useAppDispatch } from "@/redux-toolkit/customHook/hook";
import { setUpdateUser } from "@/redux-toolkit/slice/userSlice";

interface MemberEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
  onSuccess: () => void;
}

export default function MemberEditDialog({ isOpen, onOpenChange, member, onSuccess }: MemberEditDialogProps) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  // Personal details state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    dob: "",
    occupation: "",
    gender: "",
    maritalStatus: "",
    address: "",
    city: "",
    state: "",
    country: "",
    spouseName: "",
    spouseEmail: "",
    spouseMobile: "",
    spouseDob: "",
    spouseOccupation: "",
    anniversaryDate: "",
    children: [] as { name: string; age: number }[],
    businesses: [] as any[],
    accountType: "user",
  });

  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        fullName: member.fullName || "",
        email: member.email || "",
        mobile: member.mobile || "",
        dob: member.dob ? new Date(member.dob).toISOString().split("T")[0] : "",
        occupation: member.occupation || "",
        gender: member.gender || "",
        maritalStatus: member.maritalStatus || "",
        address: member.address || "",
        city: member.city || "",
        state: member.state || "",
        country: member.country || "",
        spouseName: member.spouseName || "",
        spouseEmail: member.spouseEmail || "",
        spouseMobile: member.spouseMobile || "",
        spouseDob: member.spouseDob ? new Date(member.spouseDob).toISOString().split("T")[0] : "",
        spouseOccupation: member.spouseOccupation || "",
        anniversaryDate: member.anniversaryDate ? new Date(member.anniversaryDate).toISOString().split("T")[0] : "",
        children: member.children?.length > 0 ? [...member.children] : [{ name: "", age: 0 }],
        businesses: member.businesses?.length > 0 ? [...member.businesses] : [{ businessName: "", businessCategory: "", businessDescription: "", businessPhone: "", businessAddress: "", website: "", workingHours: "", isVerified: "pending" }],
        accountType: member.accountType || "user",
      });
    }
  }, [member, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChildChange = (index: number, field: string, value: string | number) => {
    const updatedChildren = [...formData.children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setFormData(prev => ({ ...prev, children: updatedChildren }));
  };

  const addChild = () => {
    setFormData(prev => ({ ...prev, children: [...prev.children, { name: "", age: 0 }] }));
  };

  const removeChild = (index: number) => {
    if (formData.children.length > 1) {
      const updatedChildren = formData.children.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, children: updatedChildren }));
    }
  };

  const handleBusinessChange = (index: number, field: string, value: string) => {
    const updatedBusinesses = [...formData.businesses];
    updatedBusinesses[index] = { ...updatedBusinesses[index], [field]: value };
    setFormData(prev => ({ ...prev, businesses: updatedBusinesses }));
  };

  const addBusiness = () => {
    setFormData(prev => ({
      ...prev,
      businesses: [...prev.businesses, { businessName: "", businessCategory: "", businessDescription: "", businessPhone: "", businessAddress: "", website: "", workingHours: "", isVerified: "pending" }]
    }));
  };

  const removeBusiness = (index: number) => {
    if (formData.businesses.length > 1) {
      const updatedBusinesses = formData.businesses.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, businesses: updatedBusinesses }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const filteredChildren = formData.children.filter((c) => c.name.trim() !== "");
    const filteredBusinesses = formData.businesses.filter((b) => b.businessName?.trim() !== "");

    try {
      const submitData = {
        ...formData,
        children: filteredChildren,
        businesses: filteredBusinesses,
        accountType: filteredBusinesses.length > 0 ? "business" : "user",
      };

      const res = await updateUserByAdmin(member._id, submitData);

      if (res.status === 200) {
        toast({
          title: "Member Updated Successfully",
          description: `${formData.fullName}'s details have been updated.`,
        });
        dispatch(setUpdateUser(res.data.user));
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Member: {member?.fullName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Details
              </TabsTrigger>
              <TabsTrigger value="spouse" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Spouse Details
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Business Details
              </TabsTrigger>
            </TabsList>

            {/* Personal Details Tab */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select value={formData.maritalStatus} onValueChange={(val) => handleSelectChange("maritalStatus", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select value={formData.accountType} onValueChange={(val) => handleSelectChange("accountType", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Children Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Children</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addChild}>
                    Add Child
                  </Button>
                </div>
                {formData.children.map((child, index) => (
                  <div key={index} className="flex gap-2 mb-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Child Name</Label>
                      <Input
                        value={child.name}
                        onChange={(e) => handleChildChange(index, "name", e.target.value)}
                        placeholder="Child name"
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={child.age}
                        onChange={(e) => handleChildChange(index, "age", parseInt(e.target.value) || 0)}
                        placeholder="Age"
                        min="0"
                      />
                    </div>
                    {formData.children.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChild(index)}
                        className="text-destructive"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Spouse Details Tab */}
            <TabsContent value="spouse" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spouseName">Spouse Name</Label>
                  <Input
                    id="spouseName"
                    name="spouseName"
                    value={formData.spouseName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spouseEmail">Spouse Email</Label>
                  <Input
                    id="spouseEmail"
                    name="spouseEmail"
                    type="email"
                    value={formData.spouseEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spouseMobile">Spouse Mobile</Label>
                  <Input
                    id="spouseMobile"
                    name="spouseMobile"
                    value={formData.spouseMobile}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spouseDob">Spouse Date of Birth</Label>
                  <Input
                    id="spouseDob"
                    name="spouseDob"
                    type="date"
                    value={formData.spouseDob}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spouseOccupation">Spouse Occupation</Label>
                  <Input
                    id="spouseOccupation"
                    name="spouseOccupation"
                    value={formData.spouseOccupation}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anniversaryDate">Anniversary Date</Label>
                  <Input
                    id="anniversaryDate"
                    name="anniversaryDate"
                    type="date"
                    value={formData.anniversaryDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Business Details Tab */}
            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Business Information</h4>
                <Button type="button" variant="outline" size="sm" onClick={addBusiness}>
                  Add Business
                </Button>
              </div>
              {formData.businesses.map((business, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                  {formData.businesses.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBusiness(index)}
                      className="absolute top-2 right-2 text-destructive"
                    >
                      ×
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input
                        value={business.businessName || ""}
                        onChange={(e) => handleBusinessChange(index, "businessName", e.target.value)}
                        placeholder="Business name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Business Category</Label>
                      <Input
                        value={business.businessCategory || ""}
                        onChange={(e) => handleBusinessChange(index, "businessCategory", e.target.value)}
                        placeholder="Category"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Business Description</Label>
                      <Input
                        value={business.businessDescription || ""}
                        onChange={(e) => handleBusinessChange(index, "businessDescription", e.target.value)}
                        placeholder="Description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Business Phone</Label>
                      <Input
                        value={business.businessPhone || ""}
                        onChange={(e) => handleBusinessChange(index, "businessPhone", e.target.value)}
                        placeholder="Phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={business.website || ""}
                        onChange={(e) => handleBusinessChange(index, "website", e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Business Address</Label>
                      <Input
                        value={business.businessAddress || ""}
                        onChange={(e) => handleBusinessChange(index, "businessAddress", e.target.value)}
                        placeholder="Address"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Working Hours</Label>
                      <Input
                        value={business.workingHours || ""}
                        onChange={(e) => handleBusinessChange(index, "workingHours", e.target.value)}
                        placeholder="e.g., Mon-Fri 9AM-5PM"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gradient-gold text-secondary-foreground font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Member"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}