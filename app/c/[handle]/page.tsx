import { notFound } from "next/navigation";
import { personaByHandle, personas } from "@/lib/data";
import Profile from "./Profile";

export function generateStaticParams() {
  return personas.map((p) => ({ handle: p.handle }));
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = personaByHandle(handle);
  if (!p) notFound();
  return <Profile handle={p.handle} />;
}
