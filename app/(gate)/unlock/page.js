import { Lock } from "lucide-react";

export default async function UnlockPage({ searchParams }) {
  const { next = "/", error } = await searchParams;
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#05070d] px-5 text-white">
      <form method="POST" action="/api/unlock" className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur">
        <Lock className="h-6 w-6 text-[#f6c46a]" />
        <h1 className="mt-4 text-xl font-semibold">Dev environment</h1>
        <p className="mt-1 text-sm text-white/60">กรุณาใส่รหัสผ่านเพื่อเข้าชม</p>
        <input type="hidden" name="next" value={next} />
        <input
          name="password"
          type="password"
          autoFocus
          required
          autoComplete="current-password"
          placeholder="Password"
          className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-[#f6c46a]/60"
        />
        {error && <p className="mt-3 text-sm text-[#ff9a85]">รหัสผ่านไม่ถูกต้อง</p>}
        <button className="mt-5 w-full rounded-xl bg-[#f6c46a] py-3 font-semibold text-[#1a1206]">Enter</button>
      </form>
    </main>
  );
}
