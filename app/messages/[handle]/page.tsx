import { notFound } from "next/navigation";
import { personaByHandle, personas } from "@/lib/data";
import Chat from "./Chat";

export function generateStaticParams() {
  return personas.map((p) => ({ handle: p.handle }));
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!personaByHandle(handle)) notFound();
  return <Chat handle={handle} />;
}
