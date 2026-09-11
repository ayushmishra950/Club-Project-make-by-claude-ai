
import { useState, useEffect } from "react";
import { forgetPassword } from "../service/password";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Timer } from "lucide-react"; 
import { useNavigate } from "react-router-dom";

export default function ForgetPassword() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false); 
    const [timeLeft, setTimeLeft] = useState(600); 

    // --- ADDED LOGIC: Listen for success signal from the NewPassword tab ---
    useEffect(() => {
        if (!isSent) return;

        // Open a cross-tab radio communication channel
        const channel = new BroadcastChannel('password_reset_flow');
        
        channel.onmessage = (event) => {
            if (event.data?.type === 'PASSWORD_RESET_SUCCESS') {
                toast({
                    title: "Password Updated Successfully",
                    description: "We detected your password change from the other tab. Redirecting...",
                });
                
                // Immediately take the user to login on this original tab
                navigate("/login");
            }
        };

        return () => {
            channel.close(); // Clean up communication channel if component unmounts
        };
    }, [isSent, navigate, toast]);

    // Countdown and auto-redirect logic
    useEffect(() => {
        if (!isSent) return;

        if (timeLeft <= 0) {
            navigate("/login"); // Clean React-Router redirection instead of window.location.href
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isSent, timeLeft, navigate]);

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!identifier) {
            return toast({
                title: "Identifier Required",
                description: "Please enter your email or phone number to receive the reset link.",
            });
        }
        setLoading(true);
        try {
            const res = await forgetPassword(identifier);
            if (res.status === 200) {
                setIsSent(true); 
                toast({
                    title: "Link Sent Successfully",
                    description: res?.data?.message || "Password reset link sent successfully",
                });
            }
        } catch (err) {
            console.log(err);
            toast({
                title: "Reset Link Sent Failed.",
                description: err.response?.data?.message || "Failed to send reset link",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 relative">
            
            <button 
                onClick={() => navigate("/")}
                className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            {!isSent ? (
                /* --- FORGOT PASSWORD FORM --- */
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Enter your email or phone and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email or Phone</label>
                            <input
                                name="identifier"
                                type="text"
                                placeholder="Enter email or phone"
                                className="h-10 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full h-10 bg-primary hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <button 
                            onClick={() => navigate("/login")} 
                            className="text-sm text-blue-600 hover:text-blue-500 font-medium bg-transparent border-none cursor-pointer"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            ) : (
                /* --- MINI SUCCESS POPUP CARD --- */
                <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-emerald-100 text-center animate-fade-in">
                    <div className="flex justify-center mb-4 text-emerald-500">
                        <CheckCircle2 className="w-16 h-16" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Inbox</h2>
                    
                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                        A secure password reset link has been dispatched to your account credentials. Please click the link inside your email message to complete verification.
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-medium mb-6 flex items-center justify-center gap-2">
                        <Timer className="w-4 h-4 text-amber-600" />
                        Waiting for you to complete password update...
                    </div>

                    <div className="text-xs text-gray-400 mb-4">
                        Link expires automatically in <span className="font-semibold text-gray-600">{formatTime(timeLeft)}</span>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <button 
                            onClick={() => navigate("/login")} 
                            className="text-sm font-semibold text-blue-600 hover:text-blue-500 bg-transparent border-none cursor-pointer"
                        >
                            Return to Login Page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
