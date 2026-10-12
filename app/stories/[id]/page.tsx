import { notFound } from "next/navigation";
import { interactiveStories } from "@/lib/narrative";
import Reader from "./Reader";

export function generateStaticParams() {
  return interactiveStories.map((s) => ({ id: s.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!interactiveStories.find((s) => s.id === id)) notFound();
  return <Reader id={id} />;
}
