import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";

/**
 * Landing page for the Google OAuth redirect.
 *
 * The server used to JSON-encode the whole member document into this URL. That
 * put every field, contact details included, into browser history, into the
 * referrer header of the next request, and into the access log of anything
 * between the two. Only the access token arrives now, and the profile is
 * fetched over HTTPS from /me.
 */
export default function AuthSuccess() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  // React 18 StrictMode runs effects twice in development; the token is
  // consumed once so the second pass does not fire a second request.
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    const run = async () => {
      /* The token arrives in the query string, because the server redirects to
         a real path now. The hash is still read as a fallback: a link that was
         already in flight, or a browser holding the previous bundle, still
         carries the old `/#/auth-success?...` shape. */
      const hash = window.location.hash;
      const queryIndex = hash.indexOf("?");
      const source = window.location.search || (queryIndex === -1 ? "" : hash.substring(queryIndex));

      const params = new URLSearchParams(source);
      const accessToken = params.get("accessToken");

      if (!accessToken) {
        navigate("/login?error=missing_token", { replace: true });
        return;
      }

      try {
        // Stored first because the request interceptor reads the token from
        // here when it attaches the Authorization header.
        localStorage.setItem("member.accessToken", accessToken);

        const res = await api.get("/user/auth/me");

        /* Hand the session to the auth context rather than only writing local
           storage. The provider confirmed the session on boot, while this page
           was loading and before any token existed, so it holds "signed out".
           Writing storage behind its back left every guarded route still
           believing there was no session, and the redirect to the feed bounced
           straight back to the sign-in page. */
        signIn(accessToken, res.data.data);

        // Replace, so the token is not left in the history entry the back
        // button returns to.
        navigate("/home", { replace: true });
      } catch {
        localStorage.removeItem("member.accessToken");
        localStorage.removeItem("member.user");
        setError("We could not complete that sign-in. Please try again.");
        setTimeout(() => navigate("/login?error=profile_failed", { replace: true }), 2000);
      }
    };

    void run();
  }, [navigate, signIn]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {error ? (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      ) : (
        <>
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-sm text-gray-500 font-medium">Signing you in…</p>
        </>
      )}
    </div>
  );
}
