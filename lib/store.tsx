"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Application, Bundle, personas, seedApplications, seedBundles } from "./data";
import { isAwake } from "./realism";

export type ChatMessage = {
  id: string;
  from: "fan" | "persona" | "system";
  text: string;
  at: number;
  status?: "sent" | "delivered" | "read";
  ppv?: { postId: string; title: string; price: number };
  bundle?: { bundleId: string; title: string; price: number };
  voice?: { seconds: number };
  tip?: number;
  proactive?: boolean;
  broadcastId?: string;
};

export type Scheduled = {
  id: string;
  personaId: string;
  msg: ChatMessage;
  readAt: number;
  typingFrom: number;
  deliverAt: number;
};

export type TxKind = "topup" | "sub" | "ppv" | "tip" | "bundle" | "custom";
export type Transaction = { id: string; at: number; label: string; amount: number; personaId?: string; kind?: TxKind; ref?: string };

export type FanMemory = { name?: string; facts: string[] };

export type CustomRequest = {
  id: string;
  personaId: string;
  topic: string;
  style: string;
  price: number;
  deposit: number;
  status: "requested" | "accepted" | "in_progress" | "delivered" | "declined";
  createdAt: number;
  deliveredPostId?: string;
  note?: string;
};

export type Segment = "all" | "vip" | "inactive" | "no_ppv";

export type Broadcast = {
  id: string;
  personaId: string;
  text: string;
  ppvPostId?: string;
  bundleId?: string;
  price?: number;
  segment: Segment;
  sentAt: number;
  recipients: number;
  opened: number;
  purchases: number;
};

export type State = {
  ageVerified: boolean;
  balance: number;
  subscriptions: Record<string, string>;
  subscribedAt: Record<string, number>;
  unlocked: string[];
  transactions: Transaction[];
  chats: Record<string, ChatMessage[]>;
  memory: Record<string, FanMemory>;
  applications: Application[];
  fastMode: boolean;
  likes: string[];
  scheduled: Scheduled[];
  unread: Record<string, number>;
  storiesSeen: string[];
  bundles: Bundle[];
  customRequests: CustomRequest[];
  broadcasts: Broadcast[];
  tipsToGoal: Record<string, number>;
  lastFanActivity: Record<string, number>;
  lastProactive: Record<string, number>;
};

const initial: State = {
  ageVerified: false,
  balance: 50,
  subscriptions: {},
  subscribedAt: {},
  unlocked: [],
  transactions: [{ id: "t0", at: Date.now(), label: "Uvítací kredit (demo)", amount: 50, kind: "topup" }],
  chats: {},
  memory: {},
  applications: seedApplications,
  fastMode: true,
  likes: [],
  scheduled: [],
  unread: {},
  storiesSeen: [],
  bundles: seedBundles,
  customRequests: [],
  broadcasts: [],
  tipsToGoal: {},
  lastFanActivity: {},
  lastProactive: {},
};

const KEY = "aura-state-v2";

export type User = { id: string; email: string; role: "fan" | "admin" };

type Ctx = State & {
  ready: boolean;
  user: User | null;
  dbEnabled: boolean;
  syncState: "local" | "synced" | "saving" | "error";
  set: (fn: (s: State) => Partial<State>) => void;
  spend: (amount: number, label: string, meta?: { personaId?: string; kind?: TxKind; ref?: string }) => boolean;
  topUp: (amount: number) => void;
  reset: () => void;
  refreshUser: () => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

/** Starší uložený stav (v1) – paměť byla řetězec. */
function migrate(raw: Omit<Partial<State>, "memory"> & { memory?: Record<string, unknown> }): Partial<State> {
  const memory: Record<string, FanMemory> = {};
  for (const [k, v] of Object.entries(raw.memory ?? {})) {
    if (typeof v === "string") memory[k] = { facts: (v as string).split(";").map((x) => x.trim()).filter(Boolean) };
    else if (v && typeof v === "object") memory[k] = { name: (v as FanMemory).name, facts: (v as FanMemory).facts ?? [] };
  }
  return { ...raw, memory };
}

/** Odpověď persony rozložená v čase (čtení → psaní → doručení). */
export function scheduleReplies(
  personaId: string,
  texts: { text: string; voice?: boolean }[],
  opts: { readDelay: number; typingFor: (t: string) => number; after: number; extra?: Partial<ChatMessage>[] }
): Scheduled[] {
  const items: Scheduled[] = [];
  const readAt = opts.after + opts.readDelay;
  let cursor = readAt + 400;
  texts.forEach((r, i) => {
    const typingFrom = cursor + (i === 0 ? 0 : 600 + Math.random() * 1500);
    const deliverAt = typingFrom + opts.typingFor(r.text);
    items.push({
      id: crypto.randomUUID(), personaId, readAt, typingFrom, deliverAt,
      msg: {
        id: crypto.randomUUID(), from: "persona", text: r.text, at: deliverAt,
        ...(r.voice ? { voice: { seconds: Math.max(3, Math.round(r.text.length / 14)) } } : {}),
      },
    });
    cursor = deliverAt;
  });
  for (const ex of opts.extra ?? []) {
    const typingFrom = cursor + 800;
    const deliverAt = typingFrom + 1800;
    items.push({ id: crypto.randomUUID(), personaId, readAt, typingFrom, deliverAt, msg: { id: crypto.randomUUID(), from: "persona", text: "", at: deliverAt, ...ex } });
    cursor = deliverAt;
  }
  return items;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dbEnabled, setDbEnabled] = useState(false);
  const [syncState, setSyncState] = useState<Ctx["syncState"]>("local");
  const stateRef = useRef(state);
  stateRef.current = state;

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      setDbEnabled(!!me.dbEnabled);
      setUser(me.user ?? null);
      if (me.user) {
        const remote = await fetch("/api/state").then((r) => (r.ok ? r.json() : null));
        if (remote?.state) setState((s) => ({ ...s, ...migrate(remote.state), ageVerified: true }));
        setSyncState("synced");
      } else setSyncState("local");
    } catch {
      setSyncState("local");
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem("aura-state-v1");
      if (raw) setState({ ...initial, ...migrate(JSON.parse(raw)) });
    } catch {}
    setReady(true);
    refreshUser();
  }, [refreshUser]);

  // lokální uložení + synchronizace na server (s prodlevou)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
    if (!user) return;
    setSyncState("saving");
    const t = setTimeout(async () => {
      try {
        const { applications, ...rest } = stateRef.current;
        void applications;
        const r = await fetch("/api/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: rest }) });
        setSyncState(r.ok ? "synced" : "error");
      } catch {
        setSyncState("error");
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [state, ready, user]);

  // Doručování naplánovaných odpovědí – persona odpovídá, i když je fanoušek jinde v aplikaci.
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      setState((s) => {
        const now = Date.now();
        let changed = false;
        const chats = { ...s.chats };
        const unread = { ...s.unread };
        for (const sc of s.scheduled) {
          if (now >= sc.readAt) {
            const list = chats[sc.personaId] ?? [];
            if (list.some((m) => m.from === "fan" && m.status !== "read" && m.at <= sc.readAt)) {
              chats[sc.personaId] = list.map((m) => (m.from === "fan" && m.at <= sc.readAt ? { ...m, status: "read" as const } : m));
              changed = true;
            }
          }
        }
        const due = s.scheduled.filter((sc) => now >= sc.deliverAt);
        if (due.length) {
          changed = true;
          for (const sc of due) {
            chats[sc.personaId] = [...(chats[sc.personaId] ?? []), { ...sc.msg, at: sc.deliverAt }];
            unread[sc.personaId] = (unread[sc.personaId] ?? 0) + 1;
          }
        }
        if (!changed) return s;
        return { ...s, chats, unread, scheduled: s.scheduled.filter((sc) => now < sc.deliverAt) };
      });
    }, 700);
    return () => clearInterval(t);
  }, [ready]);

  // Proaktivní zprávy: persona se sama ozve po delší odmlce, jen když je „vzhůru“.
  useEffect(() => {
    if (!ready) return;
    const check = async () => {
      const s = stateRef.current;
      const quiet = s.fastMode ? 90_000 : 36 * 3_600_000;
      const cooldown = s.fastMode ? 4 * 60_000 : 24 * 3_600_000;
      for (const p of personas) {
        if (!s.subscriptions[p.id]) continue;
        if (!isAwake(p)) continue;
        if (s.scheduled.some((x) => x.personaId === p.id)) continue;
        const list = s.chats[p.id] ?? [];
        const lastMsg = list[list.length - 1]?.at ?? s.subscribedAt[p.id] ?? 0;
        if (!lastMsg || Date.now() - lastMsg < quiet) continue;
        if (Date.now() - (s.lastProactive[p.id] ?? 0) < cooldown) continue;
        setState((st) => ({ ...st, lastProactive: { ...st.lastProactive, [p.id]: Date.now() } }));
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ personaId: p.id, mode: "proactive", history: list.slice(-12).map(({ from, text }) => ({ from, text })), memory: s.memory[p.id] }),
          }).then((r) => r.json());
          const items = scheduleReplies(p.id, (res.replies ?? []).map((t: string) => ({ text: t })), {
            after: Date.now(), readDelay: 0, typingFor: (t) => Math.min(4000, 1500 + t.length * 30),
          }).map((x) => ({ ...x, msg: { ...x.msg, proactive: true } }));
          setState((st) => ({ ...st, scheduled: [...st.scheduled, ...items] }));
        } catch {}
        break; // jedna proaktivní zpráva na kontrolu
      }
    };
    const t = setInterval(check, 20_000);
    return () => clearInterval(t);
  }, [ready]);

  const set = useCallback((fn: (s: State) => Partial<State>) => {
    setState((s) => ({ ...s, ...fn(s) }));
  }, []);

  const balanceRef = useRef(state.balance);
  balanceRef.current = state.balance;

  const spend = useCallback((amount: number, label: string, meta?: { personaId?: string; kind?: TxKind; ref?: string }) => {
    if (balanceRef.current < amount) return false;
    balanceRef.current -= amount;
    setState((s) => ({
      ...s,
      balance: Math.round((s.balance - amount) * 100) / 100,
      transactions: [{ id: crypto.randomUUID(), at: Date.now(), label, amount: -amount, ...meta }, ...s.transactions],
    }));
    return true;
  }, []);

  const topUp = useCallback((amount: number) => {
    setState((s) => ({
      ...s,
      balance: s.balance + amount,
      transactions: [{ id: crypto.randomUUID(), at: Date.now(), label: "Dobití kreditu (demo)", amount, kind: "topup" }, ...s.transactions],
    }));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem("aura-state-v1");
    } catch {}
    setState({ ...initial, ageVerified: true });
  }, []);

  return (
    <StoreContext.Provider value={{ ...state, ready, user, dbEnabled, syncState, set, spend, topUp, reset, refreshUser }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

/** Odkud persona čerpá PPV/bundly do nabídek v chatu. */
export function availableOffers(s: Pick<State, "unlocked" | "bundles">, personaId: string, posts: { id: string; personaId: string; access: string; caption: string; price?: number }[]) {
  const ppv = posts.filter((x) => x.personaId === personaId && x.access === "ppv" && !s.unlocked.includes(x.id)).map((x) => ({ id: x.id, title: x.caption, price: x.price! }));
  const bundles = s.bundles.filter((b) => b.personaId === personaId && b.postIds.some((id) => !s.unlocked.includes(id)));
  return { ppv, bundles };
}
