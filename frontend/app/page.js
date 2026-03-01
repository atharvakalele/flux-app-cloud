"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import Sidebar from "@/components/Sidebar";
import Gallery from "@/components/Gallery";
import { api } from "@/lib/api";

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

  useEffect(() => {
        if (!loading && !user) {
                router.push("/login");
        }
  }, [user, loading, router]);

  const handleCreateChat = async () => {
        try {
                const chat = await api.createChat(`Flux Gen ${new Date().toLocaleTimeString()}`);
                router.push(`/chat/${chat.id}`);
        } catch (err) {
                console.error("Failed to create chat", err);
        }
  };

  if (loading || !user) {
        return <div className="pitch-black-bg" style={{ height: "100vh" }} />;
}

  return (
        <div className="pitch-black-bg" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
          <main style={{ flex: 1, marginLeft: "280px", position: "relative" }}>
        <div style={{
              padding: "20px 40px",
              display: "flex",
              justifyContent: "flex-end",
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)"
  }}>
          <button onClick={handleCreateChat} className="grok-button">
                + New Generation
    </button>
    </div>

        <Gallery />
    </main>
    </div>
  );
}
