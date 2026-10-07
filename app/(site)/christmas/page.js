import { notFound } from "next/navigation";
import { getChristmasEvent } from "@/lib/christmas";
import { generateMetadata as genMetadata } from "@/lib/seo";
import ChristmasPage from "@/components/christmas/ChristmasPage";
import { serifThai } from "@/components/christmas/fonts";
import "@/components/christmas/christmas.css";

// Toggle + form fields change in the CMS; always read fresh.
export const dynamic = "force-dynamic";

export const metadata = genMetadata({
  title: "คริสต์มาส",
  description: "ลงทะเบียนร่วมงานคริสต์มาส คริสตจักรชลบุรี",
  path: "/christmas",
});

export default async function Page() {
  const event = await getChristmasEvent();
  if (!event.enabled) notFound();
  return <ChristmasPage event={event} fontClass={serifThai.variable} />;
}
