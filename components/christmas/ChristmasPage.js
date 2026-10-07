"use client";

import { useState } from "react";
import ChristmasShell from "./ChristmasShell";
import EventHero from "./EventHero";
import RegistrationPanel from "./RegistrationPanel";

export default function ChristmasPage({ event, fontClass }) {
  const [pulse, setPulse] = useState(false);
  return (
    <ChristmasShell
      fontClass={fontClass}
      venue={event.venue}
      pulse={pulse}
      left={<EventHero event={event} />}
      right={<RegistrationPanel event={event} onCelebrate={() => setPulse(true)} />}
    />
  );
}
