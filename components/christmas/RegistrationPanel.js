"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

const inputCls =
  "peer w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 pb-2.5 pt-6 text-[15px] text-white outline-none transition placeholder:text-transparent focus:border-[#f6c46a]/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-[#f6c46a]/10";
const labelCls =
  "pointer-events-none absolute left-4 top-4 origin-left text-[15px] text-white/50 transition-all peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#f6c46a] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[11px]";

function Req() {
  return <span className="ml-0.5 text-[#ff7a5c]">*</span>;
}

// Renders one CMS-configured field (see globals/ChristmasEvent.ts formFields).
function Field({ field, value, onChange }) {
  const id = `xf-${field.name}`;
  const span = field.width === "half" ? "col-span-2 sm:col-span-1" : "col-span-2";

  if (field.type === "checkbox") {
    return (
      <label htmlFor={id} className={`${span} flex cursor-pointer items-start gap-3 text-sm text-white/75`}>
        <input id={id} type="checkbox" checked={Boolean(value)} required={field.required} onChange={(e) => onChange(e.target.checked)} className="xmas-check mt-0.5" />
        <span>{field.label}{field.required && <Req />}</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <div className={`${span} relative`}>
        <select
          id={id}
          value={value ?? ""}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} appearance-none ${value ? "" : "text-white/0"}`}
        >
          <option value="" disabled hidden />
          {field.options.map((o) => (
            <option key={o} value={o} className="bg-[#0b1630] text-white">{o}</option>
          ))}
        </select>
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 transition-all ${value ? "top-2 text-[11px] text-[#f6c46a]" : "top-4 text-[15px] text-white/50"}`}
        >
          {field.label}{field.required && <Req />}
        </label>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40">▾</span>
      </div>
    );
  }

  const common = {
    id,
    value: value ?? "",
    required: field.required,
    placeholder: field.placeholder || " ",
    onChange: (e) => onChange(e.target.value),
    className: inputCls,
  };
  return (
    <div className={`${span} relative`}>
      {field.type === "textarea" ? (
        <textarea rows={3} {...common} className={`${inputCls} resize-none`} />
      ) : (
        <input
          type={field.type}
          inputMode={field.type === "number" ? "numeric" : field.type === "tel" ? "tel" : undefined}
          min={field.type === "number" ? 0 : undefined}
          autoComplete={field.type === "tel" ? "tel" : field.type === "email" ? "email" : "off"}
          {...common}
        />
      )}
      <label htmlFor={id} className={labelCls}>
        {field.label}{field.required && <Req />}
      </label>
    </div>
  );
}

export default function RegistrationPanel({ event, onCelebrate }) {
  const router = useRouter();
  const [answers, setAnswers] = useState({});
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (state !== "idle" || !consent) return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/christmas/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, pdpaConsent: consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState("done");
      onCelebrate?.();
      setTimeout(() => router.push(`/christmas/ticket/${data.tId}`), 1400);
    } catch {
      setError("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง");
      setState("idle");
    }
  };

  return (
    <form onSubmit={submit} className="xmas-glass xmas-rise rounded-[28px] p-6 sm:p-8" style={{ animationDelay: "120ms" }}>
      <h2 className="font-[family-name:var(--font-xmas-serif)] text-xl font-semibold text-white sm:text-2xl">{event.formTitle}</h2>
      <div className="mt-1 h-px w-16 bg-gradient-to-r from-[#f6c46a] to-transparent" />

      <div className="mt-6 grid grid-cols-2 gap-3">
        {event.formFields.map((f) => (
          <Field key={f.name} field={f} value={answers[f.name]} onChange={(v) => setAnswers((a) => ({ ...a, [f.name]: v }))} />
        ))}
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-white/60">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="xmas-check mt-0.5" />
        <span>{event.pdpaText}<Req /></span>
      </label>

      {error && <p role="alert" className="mt-4 rounded-xl border border-[#ff7a5c]/30 bg-[#ff7a5c]/10 px-4 py-2.5 text-sm text-[#ffb3a1]">{error}</p>}

      <button
        type="submit"
        disabled={state !== "idle" || !consent}
        className="xmas-cta group relative mt-6 w-full overflow-hidden rounded-2xl px-6 py-4 font-semibold text-[#1a1206] transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
          {state === "done" && <Check className="h-4 w-4" />}
          {state === "done" ? "ลงทะเบียนสำเร็จ" : state === "sending" ? "กำลังลงทะเบียน..." : event.submitLabel}
        </span>
      </button>
    </form>
  );
}
