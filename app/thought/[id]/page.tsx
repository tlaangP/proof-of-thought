"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ThoughtPage() {
  const params = useParams();
  const [thought, setThought] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    async function loadThought() {
      const { data } = await supabase
        .from("thoughts")
        .select("*")
        .eq("id", params.id)
        .single();

      setThought(data);
      setLoading(false);
    }

    loadThought();
  }, [params?.id]);

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading…</p>;
  }

  if (!thought) {
    return <p style={{ padding: "40px" }}>Thought not found.</p>;
  }

  return (
    <main style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Sealed Thought</h1>

<p style={{ marginTop: "12px", fontSize: "16px" }}>
  This is a sealed declaration. It is private by default,
  <br />
  and the creator controls if and when it is made public.
  <br />
  The content, timestamp, and hash below are permanent.
</p>



      <div
  style={{
    position: "relative",
    marginTop: "20px",
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#f5f5f5",
    border: "1px solid #ddd",
    fontSize: "16px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  }}
>
  {/* Sealed badge */}
  <span
    style={{
      position: "absolute",
      top: "10px",
      right: "10px",
      backgroundColor: "#222",
      color: "white",
      fontSize: "12px",
      padding: "2px 6px",
      borderRadius: "4px",
    }}
  >
    Sealed
  </span>

  {/* Thought content */}
  {thought.content}
</div>



      <p style={{ marginTop: "20px", color: "#555" }}>
        Hash:
        <br />
        <small>{thought.hash}</small>
      </p>

      <p style={{ marginTop: "20px", fontStyle: "italic" }}>
        Sealed at {new Date(thought.created_at).toLocaleString()}
      </p>

      <p style={{ marginTop: "30px", fontWeight: "bold" }}>
        This thought cannot be edited or deleted.
      </p>
    </main>
  );
}
