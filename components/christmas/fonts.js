import { Noto_Serif_Thai } from "next/font/google";

export const serifThai = Noto_Serif_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-xmas-serif",
  display: "swap",
});
