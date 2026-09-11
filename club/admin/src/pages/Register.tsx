import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, MapPin, Loader2 } from "lucide-react";
import { validateRegisterStep } from "@/components/hook/user.form";
import { useToast } from "@/hooks/use-toast";
import {registerUser} from "@/service/auth";


export default function Register() {
    const navigate = useNavigate();
    const {toast} = useToast();
     const dateRef = useRef(null);
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState<any>({});
    const [isSubmited, setIsSubmited] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        fatherName: "",
        motherName: "",
        email: "",
        phone: "",
        dob: "",
        gender: "",
        maritalStatus: "",
        occupation: "",
        address: "",
        city: "",
        state: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: any) => {
        let obj = {...formData, [e.target.name]:e.target.value};
        setFormData(obj);
        if(isSubmited){
            const errorData = validateRegisterStep(obj, step);
            setErrors(errorData);
            
        }
    };

    const nextStep = () => {
        setIsSubmited(true);
        const errorData = validateRegisterStep(formData, step);
        setErrors(errorData);
        if (Object?.values(errorData).length === 0) {
            setStep((prev) => prev + 1);
        }

    };
    const prevStep = () => setStep((prev) => prev - 1);

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmited(true);

        const errorData = validateRegisterStep(formData, step);
        setErrors(errorData);
        if (Object.keys(errorData)?.length > 0) return;
        setIsLoading(true);
        try{
           const res = await registerUser(formData);
           if(res.status===201){
            toast({title:"Registered Successfully.", description:res?.data?.message});
            navigate("/login")
           }
        }
        catch(err){
            console.log(err);
           toast({title:"Registration Failed.", description:err?.response?.data?.message || err?.message, variant:"destructive"})
        }finally{
            setIsLoading(false);
        }
    };

    return (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="w-full max-w-xl rounded-lg border border-border bg-card p-8 shadow-warm">

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Register</h2>
        <p className="text-sm text-muted-foreground">
          ClubConnect Registration
        </p>

        <p className="text-xs mt-2 text-muted-foreground">
          Step {step} of 3
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>

        {/* ✅ STEP 1 */}
        {step === 1 && (
          <>
            {/* Full Name */}
            <div className="space-y-1 relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 pl-10 pr-3 text-sm ${
                  errors.fullName ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.fullName || ""}
              </p>
            </div>

            {/* Father Name */}
            <div className="space-y-1 relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="fatherName"
                placeholder="Father Name"
                value={formData.fatherName}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 pl-10 pr-3 text-sm ${
                  errors.fatherName ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.fatherName || ""}
              </p>
            </div>

            {/* Mother Name */}
            <div className="space-y-1 relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="motherName"
                placeholder="Mother Name"
                value={formData.motherName}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 pl-10 pr-3 text-sm ${
                  errors.motherName ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.motherName || ""}
              </p>
            </div>

            {/* DOB */}
            <div className="space-y-1 relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                ref={dateRef}
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                onClick={() => {
                  if (dateRef.current?.showPicker) dateRef.current.showPicker();
                }}
                className={`w-full rounded-md border py-2.5 pl-10 pr-3 text-sm ${
                  errors.dob ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.dob || ""}
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 px-3 text-sm ${
                  errors.gender ? "border-red-500" : "border-input"
                }`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.gender || ""}
              </p>
            </div>

            <button
              type="button"
              onClick={nextStep}
              className="w-full rounded-md bg-primary py-2.5 text-sm text-white"
            >
              Next
            </button>
          </>
        )}

        {/* ✅ STEP 2 */}
        {step === 2 && (
          <>
            {/* Email */}
            <div className="space-y-1 relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 pl-10 pr-3 text-sm ${
                  errors.email ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.email || ""}
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1 relative">
              <Lock className="absolute left-3 top-3 h-4 w-4" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 pl-10 pr-10 text-sm ${
                  errors.password ? "border-red-500" : "border-input"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.password || ""}
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 px-3 text-sm ${
                  errors.confirmPassword ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.confirmPassword || ""}
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-1 relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                name="phone"
                placeholder="Mobile Number"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 pl-10 pr-3 text-sm ${
                  errors.phone ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.phone || ""}
              </p>
            </div>

            {/* Address */}
            <div className="space-y-1 relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 pl-10 pr-3 text-sm ${
                  errors.address ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.address || ""}
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={prevStep} className="w-full border rounded-md py-2.5 text-sm">
                Back
              </button>
              <button type="button" onClick={nextStep} className="w-full bg-primary text-white rounded-md py-2.5 text-sm">
                Next
              </button>
            </div>
          </>
        )}

        {/* ✅ STEP 3 */}
        {step === 3 && (
          <>
            {["city", "state"].map((field) => (
              <div key={field} className="space-y-1">
                <input
                  type="text"
                  name={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={formData[field]}
                  onChange={handleChange}
                  className={`w-full rounded-md border py-2.5 px-3 text-sm ${
                    errors[field] ? "border-red-500" : "border-input"
                  }`}
                />
                <p className="text-xs text-red-500 min-h-[16px]">
                  {errors[field] || ""}
                </p>
              </div>
            ))}

            <div className="space-y-1">
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 px-3 text-sm ${
                  errors.maritalStatus ? "border-red-500" : "border-input"
                }`}
              >
                <option value="">Marital Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
              </select>
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.maritalStatus || ""}
              </p>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                name="occupation"
                placeholder="Occupation"
                value={formData.occupation}
                onChange={handleChange}
                className={`w-full rounded-md border py-2.5 px-3 text-sm ${
                  errors.occupation ? "border-red-500" : "border-input"
                }`}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.occupation || ""}
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={prevStep} className="w-full border rounded-md py-2.5 text-sm">
                Back
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white rounded-md py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                {isLoading ? "Registering..." : "Register"}
              </button>
            </div>
          </>
        )}

      </form>
    </div>
  </div>
);
}