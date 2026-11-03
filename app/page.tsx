"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type HelpRequest = { id: number; student_name: string; message: string; created_at: string };
export default function Home() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [source, setSource] = useState("");
  const [views, setViews] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const counted = useRef(false);
  const loadRequests = useCallback(async () => {
    const res = await fetch("/api/requests", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load requests");
    setRequests(data.requests); setSource(data.source);
  }, []);
  useEffect(() => {
    loadRequests().catch(() => setError("Could not load requests. Please refresh."));
    if (!counted.current) {
      counted.current = true;
      fetch("/api/views", { method: "POST" }).then(res => res.json()).then(data => setViews(data.views)).catch(() => setViews(null));
    }
  }, [loadRequests]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!name.trim() || !message.trim()) { setError("Please enter your name and a help request."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_name: name, message }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post request");
      setMessage(""); await loadRequests();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }
  return <main className="wrap">
    <header className="top"><span className="mark">✳</span><span>CAMPUS HELP DESK</span><span className="views">Board views: {views ?? "unavailable"}</span></header>
    <section className="intro"><p className="eyebrow">YOUR CAMPUS COMMUNITY</p><h1>Questions belong here<span>.</span></h1><p>From Wi-Fi passwords to open labs, ask away. Your next answer might be just around the corner.</p></section>
    <div className="grid"><section className="card"><p className="eyebrow">START A CONVERSATION</p><h2>Ask for help</h2><form onSubmit={submit} noValidate>
      <label htmlFor="name">Your name</label><input id="name" value={name} onChange={e => setName(e.target.value)} maxLength={50} placeholder="e.g. Arjun" />
      <label htmlFor="message">What do you need help with?</label><textarea id="message" value={message} onChange={e => setMessage(e.target.value)} maxLength={200} placeholder="Write your question here..." rows={5} />
      <div className="hint">{message.length} / 200 characters</div>{error && <p role="alert" className="error">{error}</p>}
      <button disabled={loading} type="submit">{loading ? "Posting..." : "Post Request"}<span>↗</span></button>
    </form></section>
    <section className="board"><div className="boardhead"><div><p className="eyebrow">WHAT’S HAPPENING</p><h2>Latest requests</h2></div><span className="source">{source ? `Source: ${source}` : "Loading..."}</span></div>
      {requests.length === 0 ? <div className="empty">No requests yet. Be the first to ask!</div> : <ul>{requests.map(item => <li key={item.id}><div className="avatar">{item.student_name.charAt(0).toUpperCase()}</div><div className="entry"><div className="entryhead"><strong>{item.student_name}</strong><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div><p>{item.message}</p></div></li>)}</ul>}
      <p className="foot">Showing the 10 most recent requests</p></section></div>
    <footer>MADE FOR CAMPUS COMMUNITY <span>PES1UG24AM920</span></footer>
  </main>;
}
