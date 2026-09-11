
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, MapPin, Loader2 } from "lucide-react";
import { validateRegisterStep } from "@/components/hook/user.form";
import { useToast } from "@/hooks/use-toast";
import { registerUser } from "@/service/auth";
import { FcGoogle } from "react-icons/fc";

export default function Register() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const dateRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState<any>({});
    const [isSubmited, setIsSubmited] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        dob: "",
        gender: "",
        email: "",
        mobile: "",
        address: "",
        city: "",
        state: "",
        maritalStatus: "",
        occupation: "",
        password: "",
        confirmPassword: "",
        // Spouse related fields (Optional)
        spouseName: "",
        spouseEmail: "",
        spouseMobile: "",
        spouseOccupation: "",
        spouseDob: "",
    });

    const handleGoogleRegister = () => {
    window.location.href = `http://localhost:5001/api/user/auth/google`;
};

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (isSubmited) {
            const errorData = validateRegisterStep({ ...formData, [name]: value }, step);
            setErrors(errorData);
        }
    };

    const nextStep = () => {
        setIsSubmited(true);
        const errorData = validateRegisterStep(formData, step);
        setErrors(errorData);

        if (Object.keys(errorData).length === 0) {
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmited(true);

        const errorData = validateRegisterStep(formData, step);
        setErrors(errorData);
        if (Object.keys(errorData).length > 0) return;

        setIsLoading(true);
        try {
            const res = await registerUser(formData);
            if (res.status === 201) {
                toast({ title: "Registered Successfully.", description: res?.data?.message });
                navigate("/login");
            }
        } catch (err) {
            toast({
                title: "Registration Failed.",
                description: err?.response?.data?.message || err?.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6">
            <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-warm">   {/* Reduced padding */}

                {/* Header */}
                <div className="text-center mb-5">
                    <h2 className="text-xl font-semibold">Register</h2>
                    <p className="text-sm text-muted-foreground">ClubConnect Registration</p>
                    <p className="text-xs mt-1 text-muted-foreground">Step {step} of 3</p>
                </div>

                <form onSubmit={handleSubmit}  noValidate>   {/* Reduced space-y */}

                    {/* ==================== STEP 1 ==================== */}
                    {step === 1 && (
                        <>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange}
                                        className={`w-full rounded-md border py-2.5 pl-10 text-sm ${errors.fullName ? "border-red-500" : "border-input"}`} />
                                </div>
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.fullName || ""}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Date of Birth</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input type="date" ref={dateRef} name="dob" value={formData.dob} onChange={handleChange}
                                        onClick={() => dateRef.current?.showPicker?.()}
                                        className={`w-full rounded-md border py-2.5 pl-10 text-sm ${errors.dob ? "border-red-500" : "border-input"}`} />
                                </div>
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.dob || ""}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}
                                    className={`w-full rounded-md border py-2.5 px-3 text-sm ${errors.gender ? "border-red-500" : "border-input"}`}>
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.gender || ""}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange}
                                        className={`w-full rounded-md border py-2.5 pl-10 text-sm ${errors.mobile ? "border-red-500" : "border-input"}`} />
                                </div>
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.mobile || ""}</p>
                            </div>  
                             <div className="space-y-1">
                                <label className="text-sm font-medium">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange}
                                        className={`w-full rounded-md border py-2.5 pl-10 text-sm ${errors.email ? "border-red-500" : "border-input"}`} />
                                </div>
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.email || ""}</p>
                            </div>

                            <button type="button" onClick={nextStep} className="w-full rounded-md bg-primary py-2.5 text-sm text-white mt-2">
                                Next
                            </button>
                        </>
                    )}

                    {/* ==================== STEP 2 ==================== */}
                    {step === 2 && (
                        <>
                           

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange}
                                        className={`w-full rounded-md border py-2.5 pl-10 pr-10 text-sm ${errors.password ? "border-red-500" : "border-input"}`} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.password || ""}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Confirm Password</label>
                                <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange}
                                    className={`w-full rounded-md border py-2.5 px-3 text-sm ${errors.confirmPassword ? "border-red-500" : "border-input"}`} />
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.confirmPassword || ""}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange}
                                        className={`w-full rounded-md border py-2.5 pl-10 text-sm ${errors.address ? "border-red-500" : "border-input"}`} />
                                </div>
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.address || ""}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">City</label>
                                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange}
                                    className={`w-full rounded-md border py-2.5 px-3 text-sm ${errors.city ? "border-red-500" : "border-input"}`} />
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.city || ""}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">State</label>
                                <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange}
                                    className={`w-full rounded-md border py-2.5 px-3 text-sm ${errors.state ? "border-red-500" : "border-input"}`} />
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.state || ""}</p>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={prevStep} className="w-full border rounded-md py-2.5 text-sm">Back</button>
                                <button type="button" onClick={nextStep} className="w-full bg-primary text-white rounded-md py-2.5 text-sm">Next</button>
                            </div>
                        </>
                    )}

                    {/* ==================== STEP 3 ==================== */}
                    {step === 3 && (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Marital Status</label>
                                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}
                                    className={`w-full rounded-md border py-2.5 px-3 text-sm ${errors.maritalStatus ? "border-red-500" : "border-input"}`}>
                                    <option value="">Select Marital Status</option>
                                    <option value="single">Single</option>
                                    <option value="married">Married</option>
                                </select>
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.maritalStatus || ""}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Occupation</label>
                                <input type="text" name="occupation" placeholder="Occupation" value={formData.occupation} onChange={handleChange}
                                    className={`w-full rounded-md border py-2.5 px-3 text-sm ${errors.occupation ? "border-red-500" : "border-input"}`} />
                                <p className="text-xs text-red-500 min-h-[16px]">{errors.occupation || ""}</p>
                            </div>

                            {/* Spouse Details - Optional */}
                            <div className="pt-4 border-t mt-2">
                                <p className="text-sm font-medium mb-3 text-muted-foreground">Spouse Details (Optional)</p>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Spouse Name <span className="text-xs text-muted-foreground">(Optional)</span></label>
                                    <input type="text" name="spouseName" placeholder="Spouse Name" value={formData.spouseName} onChange={handleChange}
                                        className="w-full rounded-md border py-2.5 px-3 text-sm border-input" />
                                </div>

                                <div className="space-y-1 mt-3">
                                    <label className="text-sm font-medium">Spouse Email <span className="text-xs text-muted-foreground">(Optional)</span></label>
                                    <input type="email" name="spouseEmail" placeholder="Spouse Email" value={formData.spouseEmail} onChange={handleChange}
                                        className="w-full rounded-md border py-2.5 px-3 text-sm border-input" />
                                </div>

                                <div className="space-y-1 mt-3">
                                    <label className="text-sm font-medium">Spouse Mobile <span className="text-xs text-muted-foreground">(Optional)</span></label>
                                    <input type="tel" name="spouseMobile" placeholder="Spouse Mobile" value={formData.spouseMobile} onChange={handleChange}
                                        className="w-full rounded-md border py-2.5 px-3 text-sm border-input" />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={prevStep} className="w-full border rounded-md py-2.5 text-sm">Back</button>
                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-primary text-white rounded-md py-2.5 text-sm flex items-center justify-center gap-2">
                                    {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                                    {isLoading ? "Registering..." : "Register"}
                                </button>

                            </div>
                           
                        </>
                    )}

                                    <div className="flex items-center my-5">
                    <div className="flex-1 border-t" />
                    <span className="px-3 text-sm text-muted-foreground">OR</span>
                    <div className="flex-1 border-t" />
                </div>

                <button
                    type="button"
                    onClick={handleGoogleRegister}
                    className="w-full border rounded-md py-2.5 flex items-center justify-center gap-3 hover:bg-muted"
                >
                    <FcGoogle size={22} />
                    Continue with Google
                </button>
                </form>
            </div>
        </div>
    );
}