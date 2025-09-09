// hooks/useAuthorization.ts
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function useAuthorization(allowedRoles: string[], redirectPending: boolean = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    if (session.user.status === "PENDING" && redirectPending) {
      router.push("/pending-approval");
      return;
    }

    if (!allowedRoles.includes(session.user.role)) {
      router.push("/auth/login");
    }
  }, [session, status, router, allowedRoles, redirectPending]);

  return { session, status };
}
