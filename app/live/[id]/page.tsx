import { notFound } from "next/navigation";
import { liveEvents } from "@/lib/data";
import Room from "./Room";

export function generateStaticParams() {
  return liveEvents.map((e) => ({ id: e.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!liveEvents.find((e) => e.id === id)) notFound();
  return <Room id={id} />;
}
