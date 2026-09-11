
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {loginUser} from "@/service/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {validateLoginStep} from "@/components/hook/user.form";
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, MapPin, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const {toast} = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const [formData, setFormData] = useState<any>({})
    const [isSubmited, setIsSubmited] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const handleChange = async(e)=> {
      const {name, value} = e.target;
      const obj = {...formData, [name]: value};
      setFormData(obj);

      if(isSubmited){
        const errorData = validateLoginStep(obj);
        setErrors(errorData);
      }
    }


  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmited(true);

     const errorData = validateLoginStep(formData);
            setErrors(errorData);
            if (Object.keys(errorData)?.length > 0) return;
            setIsLoading(true);
     try{
       setIsLoading(true);
       const res = await loginUser(formData);
        if(res.status===200){
           localStorage.setItem("admin.accessToken", res?.data?.accessToken);
        localStorage.setItem("admin.user", JSON.stringify(res?.data?.data))
            toast({title:"Login Successfully.", description:res?.data?.message});
            navigate("/dashboard");
           }
     }
     catch(err){
      toast({title:"Login Failed.", description:err?.response?.data?.message || err?.message, variant:"destructive"})
     }
     finally{
      setIsLoading(false);
     }
  };

return (
  <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      
      {/* Header */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">CC</span>
          </div>
          <span className="font-bold text-xl">ClubConnect</span>
        </Link>

        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sign in to your dashboard
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                value={formData?.email}
                placeholder="you@example.com"
                onChange={handleChange}
                className={errors?.email ? "border-red-500" : ""}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors?.email || ""}
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>

              <div className="relative">
                <Input
                  name="password"
                  value={formData?.password}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={handleChange}
                  className={`pr-10 ${errors?.password ? "border-red-500" : ""}`}
                />

                {/* 👁 Eye Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="text-xs text-red-500 min-h-[16px]">
                {errors?.password || ""}
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-primary font-semibold">
               {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                {isLoading ? "Sign In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/register" className="text-sm text-primary hover:underline">
              Don't have an account? Register
            </Link>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  </div>
);
}