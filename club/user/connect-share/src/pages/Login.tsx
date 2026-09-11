
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { loginUser } from "@/service/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { validateLoginStep } from "@/components/hook/user.form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams(); // Added to catch URL parameters
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmited, setIsSubmited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Catch Google Authentication errors when the component mounts
  useEffect(() => {
    const errorType = searchParams.get("error");
    if (errorType) {
      let errorMessage = "An unexpected login error occurred. Please try again.";
      
      switch (errorType) {
        case "auth_failed":
          errorMessage = "Google authentication failed. Please try again.";
          break;
        case "token_failed":
          errorMessage = "Failed to create a secure session. Please contact support.";
          break;
        case "parsing_failed":
          errorMessage = "Secure data structure was corrupted. Please try logging in again.";
          break;
        case "token_or_data_missing":
          errorMessage = "Session data missing. Please try logging in with Google again.";
          break;
      }

      // Display the error using your existing shadcn Toast setup
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Optional: Clear URL parameters so the error toast doesn't pop up again on page refresh
      navigate("/login", { replace: true });
    }
  }, [searchParams, toast, navigate]);

  // The socket for a returning OAuth session is opened by AuthProvider, which
  // knows whether the session is actually still valid. This page no longer
  // reads the stored user directly.

  const handleChange = async (e) => {
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
    if (Object.keys(errorData)?.length > 0) return;
    setIsLoading(true);
    try {
      const res = await loginUser(formData);
      
      if (res.status === 200) {
        // signIn stores the token, seeds the session context and opens the
        // socket. Writing to localStorage directly would leave the route
        // guards unaware that anybody had signed in.
        signIn(res?.data?.accessToken, res?.data?.data);
        toast({ title: "Login Successfully.", description: res?.data?.message });
        navigate("/home", { replace: true });
        setFormData({});
        setIsSubmited(false);
      }
    }
    catch (err) {
      toast({ title: "Login Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    }
    finally {
      setIsLoading(false);
    }
  };

  // Google Authentication Redirection Trigger
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL || "/api"}/user/auth/google`;
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
                <label className="text-sm font-medium">Email or Phone</label>
                <Input
                  name="identifier"
                  type="text"
                  value={formData?.identifier || ""}
                  placeholder="Enter email or phone"
                  onChange={handleChange}
                  className={errors?.identifier ? "border-red-500" : ""}
                />
                <p className="text-xs text-red-500 min-h-[16px]">
                  {errors?.identifier || ""}
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    name="password"
                    value={formData?.password || ""}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    onChange={handleChange}
                    className={`pr-10 ${errors?.password ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-red-500 min-h-[16px]">
                  {errors?.password || ""}
                </p>
                <p 
                  className="text-sm text-primary hover:underline cursor-pointer text-right" 
                  onClick={() => navigate("/forget-password")}
                >
                  Forget Password?
                </p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-primary font-semibold">
                {isLoading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* --- GOOGLE OAUTH DIVIDER & BUTTON --- */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full font-medium flex items-center justify-center gap-2 border-muted-foreground/20 hover:bg-muted/50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
            {/* ------------------------------------- */}

            <div className="mt-6 text-center">
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
