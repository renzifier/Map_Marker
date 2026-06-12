"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Form from "./components/form";
import Auth from "./components/auth";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

const Map = dynamic(() => import("./components/map"), { ssr: false });

export default function Home() {
  const [pos, setPos] = useState<[number, number]>([14.5547, 121.0244]);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [type, setType] = useState("shop");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <main style={{ height: "100vh", width: "100%", position: "relative" }}>
      <Map onPosChange={setPos} type={type} />
      <Form lat={pos[0]} lng={pos[1]} type={type} onTypeChange={setType} />

      {/* Top-right auth status */}
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 1000 }}>
        {session ? (
          <div
            style={{
              background: "white",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            {session.user.email}
            <button
              onClick={handleLogout}
              style={{ marginLeft: 8, cursor: "pointer" }}
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            style={{
              background: "#F59E0B",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Log in
          </button>
        )}
      </div>

      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
    </main>
  );
}
