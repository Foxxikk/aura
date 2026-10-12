"use client";

import { useEffect, useState } from "react";

/** Hlasová zpráva. Demo: syntéza řeči v prohlížeči; produkce: TTS s vlastním hlasem persony (např. ElevenLabs). */
export default function VoiceBubble({ text, seconds, pitch = 1.1 }: { text: string; seconds: number; pitch?: number }) {
  const [playing, setPlaying] = useState(false);
  const [showText, setShowText] = useState(false);
  const bars = Array.from({ length: 28 }, (_, i) => 30 + Math.abs(Math.sin(i * 1.7 + text.length)) * 70);

  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  function play() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) return;
    if (playing) {
      synth.cancel();
      setPlaying(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "cs-CZ";
    u.pitch = pitch;
    u.rate = 1;
    const voice = synth.getVoices().find((v) => v.lang.startsWith("cs"));
    if (voice) u.voice = voice;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    synth.cancel();
    synth.speak(u);
    setPlaying(true);
  }

  return (
    <div className="w-64 rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2">
      <div className="flex items-center gap-3">
        <button onClick={play} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-[#1a0f12]" aria-label={playing ? "Zastavit" : "Přehrát"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="flex h-8 flex-1 items-center gap-[2px]">
          {bars.map((h, i) => (
            <span key={i} className={`w-[3px] rounded-full ${playing ? "animate-pulse bg-gold" : "bg-muted/60"}`} style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }} />
          ))}
        </div>
        <span className="text-xs text-muted">0:{String(seconds).padStart(2, "0")}</span>
      </div>
      <button onClick={() => setShowText(!showText)} className="mt-1 text-[10px] text-muted underline">
        {showText ? "Skrýt přepis" : "Přepis"}
      </button>
      {showText && <p className="mt-1 text-xs text-ink/80">{text}</p>}
      <p className="mt-1 text-[10px] text-muted">AI hlas</p>
    </div>
  );
}
