"use client";
import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import Sidebar from "@/components/Sidebar";
import { api, getImageUrl } from "@/lib/api";

export default function ChatPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const chatId = params.id;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [chat, setChat] = useState(null);
    const [input, setInput] = useState("");
    const [generating, setGenerating] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (chatId && user) {
            api.getChat(chatId).then(setChat).catch(console.error);
        }
    }, [chatId, user]);

    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages]);

    const msgLength = chat?.messages?.length;

    // Determine generating state and poll if necessary
    useEffect(() => {
        let isGenerating = false;
        if (chat && chat.messages && chat.messages.length > 0) {
            const lastMsg = chat.messages[chat.messages.length - 1];
            isGenerating = lastMsg.role === "user";
        }
        setGenerating(isGenerating);

        let interval;
        if (isGenerating && chatId && user) {
            interval = setInterval(() => {
                api.getChat(chatId).then(setChat).catch(console.error);
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [msgLength, chat, chatId, user]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || generating) return;

        const prompt = input.trim();
        setInput("");
        setGenerating(true);

        // Optimistic user message update
        setChat(prev => ({
            ...prev,
            messages: [...(prev?.messages || []), { role: "user", content: prompt, created_at: new Date() }]
        }));

        try {
            const response = await api.sendMessage(chatId, prompt);
            setChat(prev => {
                // Avoid appending if polling already got it
                const exists = prev?.messages?.find(m => m.id === response.id);
                if (exists) return prev;
                return {
                    ...prev,
                    messages: [...(prev?.messages || []), response]
                };
            });
        } catch (err) {
            console.error("failed to send message", err);
            setGenerating(false);
        }
    };

    if (authLoading || !user || !chat) {
        return <div className="pitch-black-bg" style={{ height: "100vh" }} />;
    }

    return (
        <div className="pitch-black-bg" style={{ display: "flex", height: "100vh" }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: "280px", display: "flex", flexDirection: "column", position: "relative" }}>
                {/* Header */}
                <div style={{
                    padding: "15px 40px",
                    borderBottom: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)"
                }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "700" }}>{chat.title}</h2>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
                    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                        {chat.messages.length === 0 && (
                            <div style={{ textAlign: "center", marginTop: "100px" }}>
                                <h1 style={{ fontSize: "24px", color: "var(--text-muted)", fontWeight: "600" }}>What can I create for you?</h1>
                            </div>
                        )}

                        {chat.messages.map((msg, i) => (
                            <div key={i} style={{
                                marginBottom: "30px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: msg.role === "user" ? "flex-end" : "flex-start"
                            }}>
                                <div style={{
                                    maxWidth: "85%",
                                    padding: "12px 18px",
                                    borderRadius: "18px",
                                    background: msg.role === "user" ? "var(--accent)" : "var(--secondary)",
                                    color: "#fff",
                                    fontSize: "15px",
                                    lineHeight: "1.5"
                                }}>
                                    {msg.content}
                                </div>

                                {msg.image_url && (
                                    <div className="glass-morphism animate-fade-in" style={{
                                        marginTop: "15px",
                                        borderRadius: "16px",
                                        overflow: "hidden",
                                        width: "100%",
                                        maxWidth: "512px"
                                    }}>
                                        <img
                                            src={getImageUrl(msg.image_url)}
                                            alt="Generated image"
                                            style={{ width: "100%", display: "block" }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {generating && (
                            <div style={{ marginBottom: "30px", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                <div style={{
                                    background: "var(--secondary)",
                                    padding: "15px 20px",
                                    borderRadius: "18px",
                                    display: "flex",
                                    alignItems: "center"
                                }}>
                                    <div className="typing-indicator">
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                    </div>
                                    <span style={{ marginLeft: "10px", color: "var(--text-muted)", fontSize: "14px" }}>Generating image with Flux.1...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div style={{ padding: "20px 40px 40px" }}>
                    <form onSubmit={handleSend} style={{ maxWidth: "800px", margin: "0 auto", position: "relative" }}>
                        <input
                            className="grok-input"
                            placeholder="Describe the image you want to create..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={generating}
                            style={{ paddingRight: "100px", height: "56px" }}
                        />
                        <button
                            type="submit"
                            className="grok-button"
                            style={{ position: "absolute", right: "6px", top: "6px", height: "44px" }}
                            disabled={generating || !input.trim()}
                        >
                            Generate
                        </button>
                    </form>
                    <p style={{ textAlign: "center", marginTop: "15px", fontSize: "12px", color: "var(--text-muted)" }}>
                        Flux-App utilizes local hardware for image generation. History is saved locally.
                    </p>
                </div>
            </main>

            <style jsx>{`
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
