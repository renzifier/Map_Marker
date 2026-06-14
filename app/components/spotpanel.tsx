"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

type Spot = {
  id: string;
  lat: number;
  lng: number;
  photo_url: string;
  type: string;
  description: string | null;
};

type Comment = {
  id: string;
  spot_id: string;
  text: string;
  created_at: string;
};

const typeStyles: Record<string, { label: string; classes: string }> = {
  shop: { label: "Shop", classes: "bg-blue-100 text-blue-700" },
  food: { label: "Food", classes: "bg-amber-100 text-amber-700" },
  event: { label: "Event", classes: "bg-violet-100 text-violet-700" },
  alert: { label: "Alert", classes: "bg-red-100 text-red-700" },
};

export default function SpotPanel({
  spot,
  onClose,
}: {
  spot: Spot | null;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Load comments + subscribe to new ones whenever the selected spot changes
  useEffect(() => {
    if (!spot) {
      setComments([]);
      return;
    }

    async function loadComments() {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("spot_id", spot!.id)
        .order("created_at", { ascending: true });
      if (data) setComments(data);
    }
    loadComments();

    const channel = supabase
      .channel(`comments-${spot.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `spot_id=eq.${spot.id}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spot?.id]);

  // Reset expanded state and input when switching pins
  useEffect(() => {
    setExpanded(false);
    setNewComment("");
  }, [spot?.id]);

  if (!spot) return null;

  const badge = typeStyles[spot.type] || typeStyles.shop;

  function handlePointerDown(e: React.PointerEvent) {
    setDragStartY(e.clientY);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragStartY === null) return;
    const delta = e.clientY - dragStartY;

    if (delta < -30) {
      setExpanded(true);
    } else if (delta > 30) {
      if (expanded) setExpanded(false);
      else onClose();
    } else {
      setExpanded(!expanded);
    }

    setDragStartY(null);
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    const text = newComment.trim();
    setNewComment("");
    await supabase.from("comments").insert({
      spot_id: spot!.id,
      text,
    });
  }

  return (
    <div className="absolute left-0 bottom-0 w-full z-[1500] sm:top-0 sm:bottom-0 sm:h-auto sm:w-80">
      <div className="bg-white rounded-t-2xl sm:rounded-none sm:rounded-r-2xl shadow-xl overflow-hidden sm:h-full sm:flex sm:flex-col">
        {/* Drag handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none sm:hidden"
        >
          <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto" />
        </div>

        <div className="px-4 pb-4 sm:flex sm:flex-col sm:flex-1 sm:overflow-y-auto">
          <div className="flex justify-between items-start mb-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.classes}`}
            >
              {badge.label}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <img
            src={spot.photo_url}
            className="w-full aspect-video object-cover rounded-xl"
          />
          {/* Expanded content */}
          <div
            className={`overflow-hidden transition-all duration-300 sm:max-h-none sm:opacity-100 sm:mt-3 sm:flex sm:flex-col sm:flex-1 ${
              expanded ? "max-h-[60vh] opacity-100 mt-3" : "max-h-0 opacity-0"
            }`}
          >
            {spot.description && (
              <p className="text-sm text-gray-600 mb-3">{spot.description}</p>
            )}

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Comments
              </p>

              <div className="space-y-2 max-h-32 sm:max-h-none sm:flex-1 overflow-y-auto mb-2">
                {comments.length === 0 && (
                  <p className="text-xs text-gray-400">No comments yet.</p>
                )}
                {comments.map((c) => (
                  <p
                    key={c.id}
                    className="text-sm text-gray-700 bg-gray-50 rounded-lg px-2 py-1"
                  >
                    {c.text}
                  </p>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={handleAddComment}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-3 rounded-lg"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
