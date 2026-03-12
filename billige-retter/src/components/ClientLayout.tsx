"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

const PUBLIC_ROUTES = ["/login"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const isPublic = PUBLIC_ROUTES.includes(pathname);
      if (isPublic) {
        setReady(true);
        return;
      }

      // Check guest mode
      const isGuest = localStorage.getItem("weekli_guest") === "true";
      if (isGuest) {
        setReady(true);
        return;
      }

      // Check Supabase session
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
        return;
      }

      // Not authenticated — redirect to login
      router.replace("/login");
    }

    checkAuth();
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  return (
    <div className="max-w-[430px] mx-auto relative min-h-screen bg-white">
      <main className={isPublic ? "" : "pb-14"}>
        {children}
      </main>
      {!isPublic && <BottomNav />}
    </div>
  );
}
