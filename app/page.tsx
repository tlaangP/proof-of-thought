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



  useEffect(() => {
  let id = localStorage.getItem("pot_client_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pot_client_id", id);
  }
  setClientId(id);

  const unlocked = localStorage.getItem("proof_unlocked");
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
  // Public thoughts
  const { data: publicThoughts } = await supabase
    .from("thoughts")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (publicThoughts) setThoughts(publicThoughts);

  // My thoughts (private + public)
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

  // 🔒 Enforce free limit unless unlocked
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
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

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
loadThoughts(); // refresh list
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
<h1 style={{ fontSize: "32px", fontWeight: 600 }}>
  Proof of Thought
</h1>




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
  maxLength={800} // limit to 800 characters
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

{status.includes("Free limit") && !isUnlocked && (
  <div
    style={{
      marginTop: "20px",
      padding: "16px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      background: "#fafafa",
    }}
  >
    <p style={{ marginBottom: "10px", fontSize: "14px" }}>
      You’ve reached the free limit.
      <br />
      Unlock unlimited thoughts and public sharing.
    </p>

    <button
      onClick={() => {
        window.location.href =
          "https://ppcreators.gumroad.com/l/dhxtwg";
      }}
      style={{
        padding: "10px 18px",
        backgroundColor: "black",
        color: "white",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      Unlock lifetime access – $7
    </button>
    <div style={{ marginTop: "15px" }}>
  <p style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>
    Already purchased? Redeem your license key:
  </p>

  <input
  type="text"
  value={licenseKey}
  onChange={(e) => setLicenseKey(e.target.value)}
  placeholder="Enter your license key"
  style={{
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginBottom: "8px",
    fontSize: "14px",
  }}
/>


  <button
  onClick={() => {
    if (!licenseKey.trim()) {
      setStatus("Please enter a license key.");
      return;
    }
    setStatus("License verification coming next…");
  }}
  style={{
    padding: "10px 18px",
    backgroundColor: "#333",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  }}
>
  Redeem license key
</button>

</div>

  </div>
)}



{newThoughtId && (
  <p style={{ marginTop: "10px", fontSize: "14px" }}>
    <Link href={`/thought/${newThoughtId}`}>
      View your sealed thought →
    </Link>
  </p>
)}


<p style={{ marginBottom: "10px", fontSize: "12px", color: "#777" }}>
  You control if and when a thought is shared.
</p>

      <hr style={{ margin: "40px 0" }} />

{myThoughts.length > 0 && (
  <div style={{ marginTop: "30px" }}>
    <Link href="/my-thoughts">
      <button
        style={{
          padding: "12px 24px",
          backgroundColor: "#111",
          color: "white",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        View My Sealed Thoughts
      </button>
    </Link>
  </div>
)}


<hr style={{ margin: "40px 0" }} />

<h2 style={{ fontSize: "20px", fontWeight: 500 }}>
  Recently Sealed Public Thoughts
</h2>

<p style={{ fontSize: "12px", color: "#777", marginTop: "6px" }}>
  These thoughts were made public by their creators.
</p>



<ul style={{ marginTop: "15px", listStyle: "none", padding: 0 }}>
  {thoughts.map((t) => (
    <li key={t.id} style={{ marginBottom: "20px" }}>
      <Link
        href={`/thought/${t.id}`}
        style={{ textDecoration: "none", color: "black" }}
      >
        <div
          style={{
            fontWeight: 500,
            color: "#333",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {t.content}
        </div>

        <small style={{ color: "#777" }}>
          {new Date(t.created_at).toLocaleString()}
        </small>
      </Link>
    </li>
  ))}
</ul>

      <p
  style={{
    marginTop: "60px",
    fontSize: "12px",
    color: "#999",
    textAlign: "center",
  }}
>
  Proof of Thought — immutable declarations / predictions / commitments
</p>


    </main>
  );
}
