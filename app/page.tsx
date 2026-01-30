"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [thought, setThought] = useState("");
  const [status, setStatus] = useState("");
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [myThoughts, setMyThoughts] = useState<any[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [newThoughtId, setNewThoughtId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let id = localStorage.getItem("pot_client_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("pot_client_id", id);
    }
    setClientId(id);

    const unlocked = localStorage.getItem("thought_seal_unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      loadThoughts();
    }
  }, [clientId]);

  async function loadThoughts() {
    const { data: publicThoughts } = await supabase
      .from("thoughts")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (publicThoughts) setThoughts(publicThoughts);

    if (clientId) {
      const { data: mine } = await supabase
        .from("thoughts")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (mine) setMyThoughts(mine);
    }
  }

  async function sealThought() {
    if (!clientId) {
      setStatus("Preparing secure session… try again in a second.");
      return;
    }

    const { count } = await supabase
      .from("thoughts")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (!isUnlocked && (count ?? 0) >= 3) {
      setStatus("Free limit reached. Unlock unlimited thoughts.");
      return;
    }

    if (!thought.trim()) return;

    setStatus("Sealing your thought...");

    const encoder = new TextEncoder();
    const data = encoder.encode(thought);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: insertedThought, error } = await supabase
      .from("thoughts")
      .insert([
        {
          content: thought,
          hash: hashHex,
          is_public: isUnlocked ? makePublic : false,
          client_id: clientId || "unknown",
        },
      ])
      .select()
      .single();

    if (error) {
      setStatus("Error sealing thought.");
    } else {
      setThought("");
      setMakePublic(false);
      setStatus("This thought has been sealed.");
      setNewThoughtId(insertedThought.id);
      loadThoughts();
    }
  }

  return (
    <main
      style={{
        padding: "60px 40px",
        maxWidth: "640px",
        margin: "0 auto",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: 600 }}>Thought Seal</h1>

      <p style={{ marginTop: "12px", fontSize: "16px" }}>
        Make a declaration / prediction / commitment.
        <br />
        Seal it permanently.
      </p>

      <p style={{ marginTop: "10px", color: "#555", fontSize: "14px" }}>
        Your thought is cryptographically sealed.
        <br />
        It is private by default.
        <br />
        It cannot be edited or deleted.
      </p>

      <textarea
        value={thought}
        onChange={(e) => setThought(e.target.value)}
        rows={6}
        maxLength={800}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
        }}
      />

      <p style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
        {thought.length}/800 characters
      </p>

      {isUnlocked && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "15px",
            fontSize: "14px",
            color: "#333",
          }}
        >
          <input
            type="checkbox"
            checked={makePublic}
            onChange={(e) => setMakePublic(e.target.checked)}
          />
          Make this thought public (shareable)
        </label>
      )}

      <button
        onClick={sealThought}
        style={{
          marginTop: "15px",
          padding: "12px 24px",
          backgroundColor: "black",
          color: "white",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Seal Permanently
      </button>

      <p style={{ marginTop: "20px", color: "#555" }}>{status}</p>

      <p
        style={{
          marginTop: "60px",
          fontSize: "12px",
          color: "#999",
          textAlign: "center",
        }}
      >
        Thought Seal — immutable declarations / predictions / commitments
      </p>
    </main>
  );
}
