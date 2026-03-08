"use client";

import { useState } from "react";

export default function GeneratePage() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    setResult("Generating...");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic }),
    });

    const data = await res.json();
    setResult(data.result);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>Generate Content with AI</h1>

      <label style={{ display: "block", marginBottom: 10 }}>
        Topic / Niche:
      </label>
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="ex: fitness, real estate, beauty..."
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
          marginBottom: 20,
        }}
      />

      <button
        onClick={handleGenerate}
        style={{
          padding: "10px 20px",
          background: "#111827",
          color: "white",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
      >
        Generate
      </button>

      {result && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            background: "white",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
