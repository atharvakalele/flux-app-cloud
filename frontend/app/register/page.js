"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.register(username, password);
            router.push("/login");
        } catch (err) {
            setError(err.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pitch-black-bg" style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }}>
            <div className="glass-morphism animate-fade-in" style={{
                width: "100%",
                maxWidth: "400px",
                padding: "40px",
                borderRadius: "24px"
            }}>
                <h1 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "30px", textAlign: "center" }}>Create Account</h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-muted)" }}>Username</label>
                        <input
                            type="text"
                            className="grok-input"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: "30px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-muted)" }}>Password</label>
                        <input
                            type="password"
                            className="grok-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p style={{ color: "var(--error)", fontSize: "14px", marginBottom: "20px", textAlign: "center" }}>{error}</p>}

                    <button type="submit" className="grok-button" style={{ width: "100%", height: "48px" }} disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <p style={{ marginTop: "30px", textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
                    Already have an account? <Link href="/login" style={{ color: "var(--accent)", fontWeight: "600" }}>Log in</Link>
                </p>
            </div>
        </div>
    );
}
