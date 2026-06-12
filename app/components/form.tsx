"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Form({ lat, lng }: { lat: number; lng: number }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("Please log in to submit a report");
      return;
    }

    if (!photo) return alert("Please select a photo");
    setLoading(true);

    if (!photo) return alert("Please select a photo");
    setLoading(true);

    // Upload photo to Supabase Storage
    const filename = `${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filename, photo);

    if (uploadError) {
      alert("Photo upload failed");
      setLoading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("photos")
      .getPublicUrl(filename);

    // Save spot to database
    const { error: insertError } = await supabase.from("spots").insert({
      lat,
      lng,
      photo_url: urlData.publicUrl,
    });

    if (insertError) {
      alert("Failed to save spot");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done)
    return (
      <div style={styles.box}>
        <p>📍 Spot added!</p>
        <button
          onClick={() => {
            setDone(false);
            setPhoto(null);
          }}
          style={styles.button}
        >
          Report another
        </button>
      </div>
    );

  return (
    <div style={styles.box}>
      <p style={{ fontWeight: "bold", marginBottom: 8 }}>Report a spot</p>
      <p style={{ fontSize: 12, marginBottom: 8 }}>
        📍 {lat.toFixed(4)}, {lng.toFixed(4)}
      </p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
        style={{ marginBottom: 8, width: "100%" }}
      />
      <button onClick={handleSubmit} disabled={loading} style={styles.button}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}

const styles = {
  box: {
    position: "absolute" as const,
    bottom: 40,
    left: "50%",
    transform: "translateX(-50%)",
    background: "white",
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    width: 280,
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
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
