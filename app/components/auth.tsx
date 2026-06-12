"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Auth({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else onClose();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else onClose();
    }

    setLoading(false);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <p style={{ fontWeight: "bold", marginBottom: 12 }}>
          {isSignup ? "Create an account" : "Log in"}
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={styles.button}>
          {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
        </button>

        <p style={{ fontSize: 12, marginTop: 8, textAlign: "center" }}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            style={{ color: "#F59E0B", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Log in" : "Sign up"}
          </span>
        </p>

        <p
          style={{
            fontSize: 12,
            marginTop: 12,
            textAlign: "center",
            cursor: "pointer",
            color: "#999",
          }}
          onClick={onClose}
        >
          Cancel
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  box: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    width: 300,
  },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 8,
    border: "1px solid #ddd",
    borderRadius: 8,
    boxSizing: "border-box" as const,
  },
  button: {
    width: "100%",
    padding: "8px 0",
    background: "#F59E0B",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
  },
};
