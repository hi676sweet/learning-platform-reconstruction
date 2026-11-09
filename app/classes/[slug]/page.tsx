import Skillroom from "@/components/Skillroom";
import { learningClasses } from "@/lib/seed";
import { notFound } from "next/navigation";
export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!learningClasses.some(item => item.slug === slug)) notFound();
  return <Skillroom view="detail" slug={slug} />;
}
