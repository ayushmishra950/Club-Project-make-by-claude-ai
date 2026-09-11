
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft  } from "lucide-react";
import { getSingleUser, updateUser } from "@/service/auth";
import { useToast } from "@/hooks/use-toast";
import { setUserData } from "@/redux-toolkit/slice/userSlice";
import { useAppDispatch } from "@/redux-toolkit/customHook/hook";
import { useNavigate } from "react-router-dom";

export default function UserPage() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = JSON.parse(localStorage.getItem("member.user") || "{}");
    const dateRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showBusiness, setShowBusiness] = useState(false);

    const [accountType, setAccountType] = useState("user");

    const [formData, setFormData] = useState<any>({
        userId: user?._id,
        accountType: "user",
        type: "public",
        businesses: [] // Start empty - will be populated from API
    });

    const [errors, setErrors] = useState({
        skills: "",
        hobbies: "",
    });

    const [preview, setPreview] = useState<any>({
        profileImage: "",
        coverImage: "",
        businessCoverImages: {} as Record<number, string>,
    });

    const handleChange = (e: any) => {
        const { name, value, files, type, checked } = e.target;

        if (files) {
            const file = files[0];
            setFormData({ ...formData, [name]: file });

            setPreview({
                ...preview,
                [name]: URL.createObjectURL(file),
            });
        } else if (type === "checkbox") {
            setFormData({ ...formData, [name]: checked });
        } else {
            const items = value.split(",").map((item: string) => item.trim()).filter(Boolean);

            if (items.length > 5 && (name === "skills" || name === "hobbies")) {
                setErrors({ ...errors, [name]: "Maximum 5 items allowed" });
            } else {
                setErrors({ ...errors, [name]: "" });
                setFormData({ ...formData, [name]: value });
            }
        }
    };


    const handleChildChange = (index: number, e: any) => {
        const { name, value } = e.target;

        const updatedChildren = [...(formData.children || [])];

        updatedChildren[index] = {
            ...updatedChildren[index],
            [name]: name === "age" ? Number(value) : value
        };

        setFormData({
            ...formData,
            children: updatedChildren
        });
    };

    // Business Handlers
    const handleBusinessChange = (index: number, e: any) => {
        const { name, value, files } = e.target;
        const updatedBusinesses = [...formData.businesses];

        if (files) {
            const file = files[0];
            updatedBusinesses[index][name] = file;

            // Preview for business cover image
            setPreview({
                ...preview,
                businessCoverImages: {
                    ...preview.businessCoverImages,
                    [index]: URL.createObjectURL(file)
                }
            });
        } else {
            updatedBusinesses[index][name] = value;
        }

        setFormData({
            ...formData,
            businesses: updatedBusinesses
        });
    };

    const addBusiness = () => {
        setFormData({
            ...formData,
            businesses: [
                ...formData.businesses,
                {
                    businessName: "",
                    businessCategory: "",
                    website: "",
                    businessDescription: "",
                    businessPhone: "",
                    workingHours: "",
                    businessAddress: "",
                    businessCoverImage: null
                }
            ]
        });
    };

    const removeBusiness = (index: number) => {
        const updatedBusinesses = formData.businesses.filter((_: any, i: number) => i !== index);

        // Remove preview for deleted business
        const updatedPreviews = { ...preview.businessCoverImages };
        delete updatedPreviews[index];

        setPreview({
            ...preview,
            businessCoverImages: updatedPreviews
        });

        setFormData({
            ...formData,
            businesses: updatedBusinesses
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            const form = new FormData();

            // Explicitly add userId from the logged-in user context or formData
            const finalUserId = user?._id || formData?._id || formData?.userId;
            if (finalUserId) {
                form.append("userId", finalUserId);
            }

            Object.keys(formData).forEach((key) => {
                const excluded = ["businesses", "userId", "_id", "friends", "isOnline", "lastSeen", "role", "blocked", "children"];
                if (!excluded.includes(key)) {
                    if (formData[key] !== undefined && formData[key] !== null) {
                        form.append(key, formData[key]);
                    }
                }
            });
            if (formData.children) {
                form.append("children", JSON.stringify(formData.children));
            }

            // Clean businesses array for JSON (remove File objects to avoid {})
            const businessesForJSON = formData.businesses.map((biz: any) => {
                const bizCopy = { ...biz };
                if (bizCopy.businessCoverImage instanceof File) {
                    delete bizCopy.businessCoverImage;
                }
                return bizCopy;
            });

            form.append("businesses", JSON.stringify(businessesForJSON));

            formData.businesses.forEach((biz: any, index: number) => {
                if (biz.businessCoverImage instanceof File) {
                    form.append(`businessCoverImage_${index}`, biz.businessCoverImage);
                }
            });

            const res = await updateUser(form);

            if (res.status === 200) {
                const updatedUser = res.data.user;
                if (updatedUser) {
                    localStorage.setItem("member.user", JSON.stringify(updatedUser));
                    dispatch(setUserData(updatedUser));
                }
               
                toast({ title: "Profile Updated Successfully", description: res.data.message });
                handleGetUser();
            }
        } catch (err: any) {
            console.log(err?.response?.data?.message || err.message);
            toast({ title: "Update Failed", description: err?.response?.data?.message || err?.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetUser = async () => {
        try {
            const res = await getSingleUser(user?._id);
            if (res.status === 200) {
                const data = res?.data?.data || {};

                setFormData({
                    ...data,
                    businesses: data.businesses?.length > 0
                        ? data.businesses
                        : [{
                            businessName: "",
                            businessCategory: "",
                            website: "",
                            businessDescription: "",
                            businessPhone: "",
                            workingHours: "",
                            businessAddress: "",
                            businessCoverImage: ""
                        }]
                });

                setAccountType(data?.accountType || "user");
                if (data.accountType === "business") setShowBusiness(true);
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        handleGetUser();
    }, []);

    return (
        <div className="w-full min-h-screen bg-gray-50 py-8 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}

<div className="mb-8">
  <div className="flex items-center gap-3">
    <button
      onClick={() => navigate(-1)} // ya apna back function
      className="text-gray-700 hover:text-black"
    >
      <ArrowLeft  size={24} />
    </button>

    <div>
      <h1 className="text-3xl font-semibold text-gray-900">
        Profile Settings
      </h1>
      <p className="text-gray-600 mt-1">
        Update your personal and business information
      </p>
    </div>
  </div>
</div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Cover + Profile Image Section - Unchanged */}
                    <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">
                        <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                            {preview.coverImage || formData.coverImage ? (
                                <img
                                    src={preview.coverImage || formData.coverImage}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
                            )}

                            <div className="absolute -bottom-12 left-8">
                                <div className="relative">
                                    <div className="w-28 h-28 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-md">
                                        {(preview.profileImage || formData.profileImage) ? (
                                            <img
                                                src={preview.profileImage || formData.profileImage}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                No Photo
                                            </div>
                                        )}
                                    </div>
                                    <label htmlFor="profileImage" className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow cursor-pointer hover:bg-gray-100">
                                        <input
                                            id="profileImage"
                                            type="file"
                                            name="profileImage"
                                            onChange={handleChange}
                                            className="hidden"
                                        />
                                        📸
                                    </label>
                                </div>
                            </div>

                            <label htmlFor="coverImage" className="absolute top-4 right-4 bg-white/90 hover:bg-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer shadow flex items-center gap-2">
                                <input
                                    id="coverImage"
                                    type="file"
                                    name="coverImage"
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                Change Cover
                            </label>
                        </div>
                        <div className="h-14"></div>
                    </div>

                    {/* Account Type - Unchanged */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Account Type</label>
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => {
                                    setAccountType("user");
                                    setFormData({ ...formData, accountType: "user" });
                                }}
                                className={`px-6 py-2.5 rounded-[10px] text-sm font-medium transition-all ${accountType === "user"
                                    ? "bg-white shadow text-gray-900"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Personal User
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAccountType("business");
                                    setFormData({ ...formData, accountType: "business" });
                                    setShowBusiness(true);
                                }}
                                className={`px-6 py-2.5 rounded-[10px] text-sm font-medium transition-all ${accountType === "business"
                                    ? "bg-white shadow text-gray-900"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Business Account
                            </button>
                        </div>
                    </div>

                    {/* Basic Information - Unchanged */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900">Basic Information</h2>
                        {/* All your original Basic Information fields remain exactly same */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <input name="spouseName" value={formData.fullName || ""} onChange={handleChange} className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter spouse name" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                                <input
                                    type="date"
                                    ref={dateRef}
                                    name="dob"
                                    value={formData?.dob ? new Date(formData.dob).toISOString().split("T")[0] : ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Occupation</label>
                                <input name="occupation" value={formData.occupation || ""} onChange={handleChange} className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    name="mobile"
                                    value={formData.mobile || ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Spouse Name (Optional)</label>
                                <input name="spouseName" value={formData.spouseName || ""} onChange={handleChange} className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter spouse name" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Spouse Date of Birth (Optional)</label>
                                <input
                                    type="date"
                                    ref={dateRef}
                                    name="spouseDob"
                                    value={formData?.spouseDob ? new Date(formData.spouseDob).toISOString().split("T")[0] : ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Spouse Occupation (Optional)</label>
                                <input name="spouseOccupation" value={formData.spouseOccupation || ""} onChange={handleChange} className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Spouse Phone (Optional)</label>
                                <input
                                    name="spouseMobile"
                                    value={formData.spouseMobile || ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Aniversary Date (Optional)</label>
                                <input
                                    type="date"
                                    ref={dateRef}
                                    name="anniversaryDate"
                                    value={formData?.anniversaryDate ? new Date(formData.anniversaryDate).toISOString().split("T")[0] : ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address || ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">State</label>
                                <input name="state" value={formData.state || ""} onChange={handleChange} className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Country</label>
                                <input name="country" value={formData.country || ""} onChange={handleChange} className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                        </div>
                        <div className="mt-6 space-y-6">
                            {formData.children?.map((child, index) => (
                                <div key={index} className="border p-4 rounded-xl bg-gray-50">

                                    {/* Child Label */}
                                    <h3 className="text-md font-semibold text-gray-800 mb-4">
                                        Child {index + 1}
                                    </h3>

                                    {/* Inputs Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Name */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Child Name
                                            </label>
                                            <input
                                                name="name"
                                                value={child.name || ""}
                                                onChange={(e) => handleChildChange(index, e)}
                                                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter child name"
                                            />
                                        </div>

                                        {/* Age */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Age
                                            </label>
                                            <input
                                                name="age"
                                                value={child.age || ""}
                                                onChange={(e) => handleChildChange(index, e)}
                                                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter age"
                                            />
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact & Location */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900">All Email Addresses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Spouse Email (Optional)</label>
                                <input
                                    name="spouseEmail"
                                    value={formData.spouseEmail || ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter spouse email"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Verified Checkbox */}
                    <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-200">
                        <div className="pointer-events-none flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={formData.isVerified || false}
                                className="w-5 h-5 text-blue-600 rounded border-gray-300"
                            />
                            <label className="text-sm font-medium text-gray-700">
                                Mark this profile as Verified
                            </label>
                        </div>
                    </div>

                    {/* ==================== IMPROVED MULTIPLE BUSINESS SECTION ==================== */}
                    {formData?.accountType === "business" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowBusiness(!showBusiness)}
                                className="w-full flex items-center justify-between px-8 py-6 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Business Details</h2>
                                    <p className="text-sm text-gray-500">Add and manage multiple businesses</p>
                                </div>
                                {showBusiness ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {showBusiness && (
                                <div className="px-8 pb-8 space-y-8 border-t pt-6">
                                    {formData.businesses.map((biz: any, index: number) => (
                                        <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-gray-50 relative">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-semibold">Business {index + 1}</h3>
                                                {formData.businesses.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBusiness(index)}
                                                        className="text-red-600 hover:text-red-700 p-1"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Business Name</label>
                                                    <input
                                                        name="businessName"
                                                        value={biz.businessName || ""}
                                                        onChange={(e) => handleBusinessChange(index, e)}
                                                        className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Business Name"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Business Cover Image</label>
                                                    <input
                                                        type="file"
                                                        name="businessCoverImage"
                                                        accept="image/*"
                                                        onChange={(e) => handleBusinessChange(index, e)}
                                                        className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl"
                                                    />
                                                    {(preview.businessCoverImages[index] || (typeof biz.businessCoverImage === "string" && biz.businessCoverImage)) && (
                                                        <img
                                                            src={preview.businessCoverImages[index] || biz.businessCoverImage}
                                                            className="mt-3 h-32 w-full object-cover rounded-xl border"
                                                            alt="Business Cover"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rest of business fields - same as your original but inside map */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                <input name="businessCategory" placeholder="Category" value={biz.businessCategory || ""} onChange={(e) => handleBusinessChange(index, e)} className="px-4 py-3 border border-gray-300 rounded-xl" />
                                                <input name="website" placeholder="Website" value={biz.website || ""} onChange={(e) => handleBusinessChange(index, e)} className="px-4 py-3 border border-gray-300 rounded-xl" />
                                            </div>

                                            <textarea name="businessDescription" placeholder="Description" value={biz.businessDescription || ""} onChange={(e) => handleBusinessChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-xl mt-6" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                <input name="businessPhone" placeholder="Phone" value={biz.businessPhone || ""} onChange={(e) => handleBusinessChange(index, e)} className="px-4 py-3 border border-gray-300 rounded-xl" />
                                                <input name="workingHours" placeholder="Working Hours" value={biz.workingHours || ""} onChange={(e) => handleBusinessChange(index, e)} className="px-4 py-3 border border-gray-300 rounded-xl" />
                                            </div>

                                            <input name="businessAddress" placeholder="Address" value={biz.businessAddress || ""} onChange={(e) => handleBusinessChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-xl mt-6" />
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addBusiness}
                                        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-blue-400 hover:border-blue-600 text-blue-600 hover:text-blue-700 rounded-2xl transition-all font-medium"
                                    >
                                        <Plus size={20} />
                                        Add Another Business
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Password Section - Unchanged */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900">Security</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password || ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-10 text-gray-500 hover:text-gray-700">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword || ""}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button - Unchanged */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-10 py-3.5 rounded-2xl font-medium flex items-center gap-3 shadow-lg shadow-blue-500/30 disabled:opacity-70"
                        >
                            {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
                            Save All Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}