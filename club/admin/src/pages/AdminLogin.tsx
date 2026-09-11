import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { validateLoginStep } from "@/components/hook/user.form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAdmin } from "@/service/auth"; 

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmited, setIsSubmited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    const obj = { ...formData, [name]: value };
    setFormData(obj);

    if (isSubmited) {
      const errorData = validateLoginStep(obj);
      setErrors(errorData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmited(true);

    const errorData = validateLoginStep(formData);
    setErrors(errorData);

    if (Object.keys(errorData).length > 0) return;

    try {
      setIsLoading(true);

      // `role` used to be sent from here. The server takes the role from the
      // account record, so a client-supplied one was ignored at best.
      const res = await loginAdmin(formData);
      if (res.status === 200) {
        // signIn stores the token, seeds the session context and opens the
        // socket, so the route guards see the session immediately.
        signIn(res?.data?.accessToken, res?.data?.admin);
        toast({ title: "Admin Login Successful", description: res?.data?.message });
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.log(err);
      toast({
        title: "Login Failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive"
      });
    } finally {
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

          <h1 className="text-2xl font-bold text-red-500">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Access admin dashboard
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Admin Email</label>
                <Input
                  name="email"
                  type="email"
                  value={formData?.email || ""}
                  placeholder="admin@example.com"
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
                    type={showPassword ? "text" : "password"}
                    value={formData?.password || ""}
                    placeholder="••••••••"
                    onChange={handleChange}
                    className={`pr-10 ${
                      errors?.password ? "border-red-500" : ""
                    }`}
                  />

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

              {/* Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white font-semibold hover:bg-red-600 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                {isLoading ? "Signing In..." : "Login as Admin"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline"
              >
                Back to User Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}