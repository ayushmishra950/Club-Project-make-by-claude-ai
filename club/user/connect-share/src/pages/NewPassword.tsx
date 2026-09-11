
import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom"; 
import { updatePassword } from "../service/password"; 
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";

export default function NewPassword() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token"); 

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            return toast({
                title: "Fields Required",
                description: "Please fill out both password input fields.",
                variant: "destructive"
            });
        }

        if (password.length < 6) {
            return toast({
                title: "Weak Password",
                description: "Password must be at least 6 characters long.",
                variant: "destructive"
            });
        }

        if (password !== confirmPassword) {
            return toast({
                title: "Passwords Mismatch",
                description: "The confirmation password does not match your new password.",
                variant: "destructive"
            });
        }

        setLoading(true);
        try {
            const res = await updatePassword(token, password);
            
            if (res.status === 200) {
                toast({
                    title: "New Password Set Successfully",
                    description: res?.data?.message || "Your password has been updated successfully.",
                });

                // --- 1. BROADCAST SIGNAL: Tell the original ForgetPassword tab that we are done! ---
                const channel = new BroadcastChannel('password_reset_flow');
                channel.postMessage({ type: 'PASSWORD_RESET_SUCCESS' });
                channel.close(); // Clean up channel connection immediately

                // --- 2. CLOSE TAB WITH SAFE FALLBACK ---
                setTimeout(() => {
                    window.close(); // Close this tab automatically

                    // Fallback: If browser security blocks window.close() (because it opened directly from an external email app),
                    // redirect this tab to login so the user isn't stuck on a blank page.
                    navigate("/login"); 
                }, 1000);
            }
        } catch (err) {
            console.log(err);
            toast({
                title: "Reset Failed",
                description: err.response?.data?.message || "Failed to update password. Link might be invalid or expired.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 relative">
            
            <button 
                onClick={() => navigate("/login")}
                className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
            </button>

            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-3">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Please choose a strong, secure password that you don't use elsewhere.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    
                    <div className="flex flex-col space-y-1.5 relative">
                        <label className="text-sm font-medium text-gray-700">New Password</label>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-10 w-full rounded-lg border border-gray-300 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-1.5 relative">
                        <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPass ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-10 w-full rounded-lg border border-gray-300 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full h-10 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                        disabled={loading}
                    >
                        {loading ? "Updating Password..." : "Reset Password"}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button 
                        onClick={() => navigate("/login")} 
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium bg-transparent border-none cursor-pointer"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
