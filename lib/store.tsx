"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Application, seedApplications } from "./data";

export type ChatMessage = {
  id: string;
  from: "fan" | "persona" | "system";
  text: string;
  at: number;
  status?: "sent" | "delivered" | "read";
  ppv?: { postId: string; title: string; price: number; unlocked?: boolean };
  tip?: number;
};

export type Scheduled = {
  id: string;
  personaId: string;
  msg: ChatMessage;
  readAt: number;
  typingFrom: number;
  deliverAt: number;
};

export type Transaction = { id: string; at: number; label: string; amount: number };

type State = {
  ageVerified: boolean;
  balance: number;
  subscriptions: Record<string, string>;
  unlocked: string[];
  transactions: Transaction[];
  chats: Record<string, ChatMessage[]>;
  memory: Record<string, string>;
  applications: Application[];
  fastMode: boolean;
  likes: string[];
  scheduled: Scheduled[];
  unread: Record<string, number>;
};

const initial: State = {
  ageVerified: false,
  balance: 50,
  subscriptions: {},
  unlocked: [],
  transactions: [{ id: "t0", at: Date.now(), label: "Uvítací kredit (demo)", amount: 50 }],
  chats: {},
  memory: {},
  applications: seedApplications,
  fastMode: true,
  likes: [],
  scheduled: [],
  unread: {},
};

const KEY = "aura-state-v1";

type Ctx = State & {
  ready: boolean;
  set: (fn: (s: State) => Partial<State>) => void;
  spend: (amount: number, label: string) => boolean;
  topUp: (amount: number) => void;
  reset: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  // Doručování naplánovaných odpovědí – persona odpovídá, i když je fanoušek jinde v aplikaci.
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      setState((s) => {
        const now = Date.now();
        let changed = false;
        const chats = { ...s.chats };
        const unread = { ...s.unread };
        // přečteno
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

  const set = useCallback((fn: (s: State) => Partial<State>) => {
    setState((s) => ({ ...s, ...fn(s) }));
  }, []);

  const balanceRef = useRef(state.balance);
  balanceRef.current = state.balance;

  const spend = useCallback((amount: number, label: string) => {
    if (balanceRef.current < amount) return false;
    balanceRef.current -= amount;
    setState((s) => ({
      ...s,
      balance: Math.round((s.balance - amount) * 100) / 100,
      transactions: [{ id: crypto.randomUUID(), at: Date.now(), label, amount: -amount }, ...s.transactions],
    }));
    return true;
  }, []);

  const topUp = useCallback((amount: number) => {
    setState((s) => ({
      ...s,
      balance: s.balance + amount,
      transactions: [{ id: crypto.randomUUID(), at: Date.now(), label: "Dobití kreditu (demo)", amount }, ...s.transactions],
    }));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setState({ ...initial, ageVerified: true });
  }, []);

  return (
    <StoreContext.Provider value={{ ...state, ready, set, spend, topUp, reset }}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
