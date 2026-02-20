"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MyThoughtsPage() {
  const [myThoughts, setMyThoughts] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("pot_client_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("pot_client_id", id);
    }
    setClientId(id);
  }, []);

  useEffect(() => {
    if (!clientId) return;

    async function loadMyThoughts() {
      const { data } = await supabase
        .from("thoughts")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (data) setMyThoughts(data);
    }

    loadMyThoughts();
  }, [clientId]);

  return (
    <main
  style={{
    padding: "60px 40px",
    maxWidth: "640px",
    margin: "0 auto",
    color: "#FFFFFF",
  }}
>
      <h1 style={{ fontSize: "32px", fontWeight: 600 }}>My Sealed Thoughts</h1>

      {myThoughts.length === 0 && (
        <p style={{ marginTop: "20px", color: "#B0BEC5" }}>
          Retriving thoughts...
        </p>
      )}

      <ul style={{ marginTop: "20px", listStyle: "none", padding: 0 }}>
        {myThoughts.map((t) => (
          <li key={t.id} style={{ marginBottom: "20px" }}>
            <Link href={`/thought/${t.id}`} style={{ textDecoration: "none", color: "#FFFFFF" }}>
              <div style={{ fontWeight: 500, marginBottom: "4px" }}>{t.content}</div>
              <small style={{ color: "#777" }}>
                {new Date(t.created_at).toLocaleString()}
              </small>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
