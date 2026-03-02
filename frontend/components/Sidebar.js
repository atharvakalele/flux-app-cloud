"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const [chats, setChats] = useState([]);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (user) {
            api.getChats().then(setChats).catch(console.error);
        }
    }, [user]);

    const confirmDelete = async () => {
        if (!chatToDelete) return;
        setIsDeleting(true);
        try {
            await api.deleteChat(chatToDelete);
            setChats(prev => prev.filter(c => c.id !== chatToDelete));
            // Trigger event for gallery to update
            window.dispatchEvent(new Event("chatDeleted"));

            if (pathname === `/chat/${chatToDelete}`) {
                router.push("/");
            }
        } catch (err) {
            console.error("Failed to delete chat", err);
            // Non-blocking toast could go here instead of alert
        } finally {
            setIsDeleting(false);
            setChatToDelete(null);
        }
    };

    if (!user) return null;

    return (
        <aside className="glass-morphism" style={{
            width: "280px",
            height: "100vh",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            left: 0,
            top: 0,
            zIndex: 100
        }}>
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#fff" }}>Flux App</h1>
            </div>

            <Link href="/" className="grok-button-outline" style={{ display: "block", marginBottom: "20px", textAlign: "center" }}>
                Home / Gallery
            </Link>

            <div style={{ flex: 1, overflowY: "auto" }}>
                <h2 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "15px", textTransform: "uppercase" }}>Your Chats</h2>
                {chats.map(chat => (
                    <div key={chat.id} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                        <Link href={`/chat/${chat.id}`} style={{
                            flex: 1,
                            display: "block",
                            padding: "10px",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "14px",
                            transition: "background 0.2s"
                        }} className="sidebar-link">
                            {chat.title}
                        </Link>
                        <button
                            onClick={() => setChatToDelete(chat.id)}
                            title="Delete Chat"
                            style={{
                                background: "rgba(255, 0, 0, 0.1)",
                                border: "none",
                                color: "#ff4d4f",
                                cursor: "pointer",
                                padding: "10px",
                                borderRadius: "8px",
                                marginLeft: "5px",
                                transition: "background 0.2s"
                            }}
                            className="delete-button"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                    <div style={{ width: "32px", height: "32px", backgroundColor: "var(--accent)", borderRadius: "50%", marginRight: "10px" }} />
                    <span style={{ fontWeight: "600" }}>{user.username}</span>
                </div>
                <button onClick={logout} className="grok-button-outline" style={{ width: "100%", fontSize: "13px" }}>
                    Log out
                </button>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {chatToDelete && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
                }}>
                    <div className="glass-morphism animate-fade-in" style={{
                        padding: "30px", borderRadius: "16px", width: "400px", maxWidth: "90%"
                    }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "15px", color: "#fff" }}>Complete Deletion</h3>
                        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "25px", lineHeight: "1.5" }}>
                            Are you absolutely sure you want to delete this chat? This action cannot be undone and will permanently erase all messages and generated images from the database and storage.
                        </p>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setChatToDelete(null)}
                                className="grok-button-outline"
                                style={{ padding: "10px 20px", fontSize: "13px" }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="grok-button"
                                style={{ padding: "10px 20px", fontSize: "13px", background: "#ff4d4f", borderColor: "#ff4d4f" }}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .delete-button:hover {
          background: rgba(255, 0, 0, 0.2) !important;
        }
      `}</style>
        </aside>
    );
}
