"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
       <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-brand-800" />
    </div>
  );
}
