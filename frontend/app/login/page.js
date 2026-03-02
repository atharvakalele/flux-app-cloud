"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { api } from "@/lib/api";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await api.login(username, password);
            login({ username }, data.access_token);
        } catch (err) {
            setError(err.message || "Failed to log in");
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
                <h1 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "30px", textAlign: "center" }}>Welcome Back</h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-muted)" }}>Username</label>
                        <input
                            type="text"
                            className="grok-input"
                            placeholder="Enter your username"
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
                        {loading ? "Logging in..." : "Log in"}
                    </button>
                </form>

                <p style={{ marginTop: "30px", textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
                    Don't have an account? <Link href="/register" style={{ color: "var(--accent)", fontWeight: "600" }}>Register</Link>
                </p>
            </div>
        </div>
    );
}
