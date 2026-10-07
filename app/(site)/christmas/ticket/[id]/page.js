import { notFound } from "next/navigation";
import { getChristmasEvent, getRegistrationByTicket } from "@/lib/christmas";
import TicketView from "@/components/christmas/TicketView";
import { serifThai } from "@/components/christmas/fonts";
import "@/components/christmas/christmas.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "บัตรเชิญคริสต์มาส", robots: { index: false } };

export default async function Page({ params }) {
  const { id } = await params;
  if (!/^[a-z0-9-]{4,40}$/i.test(id)) notFound();
  const [event, registration] = await Promise.all([getChristmasEvent(), getRegistrationByTicket(id)]);
  if (!event.enabled || !registration) notFound();
  // Only the ticket-facing fields leave the server.
  const safe = { tId: registration.tId, displayName: registration.displayName, createdAt: registration.createdAt };
  return <TicketView event={event} registration={safe} fontClass={serifThai.variable} />;
}
