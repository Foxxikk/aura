import { currentEvent } from "@/lib/data";

export default function EventBanner() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-gradient-to-r from-[#3a1d14] to-[#2a1222] px-4 py-3 text-sm">
      <span className="ai-badge">Akce</span>
      <b>{currentEvent.title}</b>
      <span className="text-muted">{currentEvent.description}</span>
      <span className="ml-auto text-xs text-gold">Končí za {currentEvent.endsInHours} h</span>
    </div>
  );
}
