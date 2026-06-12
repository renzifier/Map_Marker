"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Form({
  lat,
  lng,
  type,
  onTypeChange,
}: {
  lat: number;
  lng: number;
  type: string;
  onTypeChange: (type: string) => void;
}) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [description, setDescription] = useState("");

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
      type,
      description,
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl shadow-xl p-5 w-72 text-center">
        <p className="text-2xl mb-1">📍</p>
        <p className="font-semibold text-gray-800 mb-3">Spot added!</p>
        <button
          onClick={() => {
            setDone(false);
            setPhoto(null);
            setDescription("");
          }}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          Report another
        </button>
      </div>
    );

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl shadow-xl p-5 w-80">
      <p className="font-semibold text-gray-800 mb-1">Report a spot</p>
      <p className="text-xs text-gray-400 mb-3">
        📍 {lat.toFixed(4)}, {lng.toFixed(4)}
      </p>

      <div className="flex gap-2 mb-3">
        {[
          { key: "shop", label: "Shop", color: "bg-blue-500" },
          { key: "food", label: "Food", color: "bg-amber-500" },
          { key: "event", label: "Event", color: "bg-violet-500" },
          { key: "alert", label: "Alert", color: "bg-red-500" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => onTypeChange(t.key)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
              type === t.key
                ? `${t.color} text-white`
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Add a description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={300}
        rows={2}
        className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-2 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      <label className="block mb-3">
        <span className="sr-only">Choose photo</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:font-medium hover:file:bg-amber-100"
        />
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
