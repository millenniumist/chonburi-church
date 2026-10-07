import { Sarabun } from "next/font/google";
import "../(site)/globals.css";

const sarabun = Sarabun({ weight: ["400", "600"], subsets: ["thai", "latin"] });

export const metadata = { title: "Locked", robots: { index: false, follow: false } };

export default function GateLayout({ children }) {
  return (
    <html lang="th">
      <body className={sarabun.className}>{children}</body>
    </html>
  );
}
