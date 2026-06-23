# Image Assets — generation prompts

> One prompt per asset the **Coffee & Gospel** site needs, ready to paste into any
> capable image generator (Midjourney, Flux, Imagen, DALL·E, Ideogram, etc.).
> Every prompt is self-contained — it already includes the brand art-direction.
>
> Brand in one line: a small **Thai church café in Chonburi** that gives away **free
> coffee** as gospel hospitality. Warm, calm, neighborly — *Matthew 11:28, "come and
> rest."* Photographic and authentic, never stock, never megachurch, never kitsch.

---

## How to use this doc

1. Pick an asset below, copy its **Prompt**, generate.
2. Generate at the **Aspect** given; upscale to (or above) the **Target size**.
3. Run the output through the **[web pipeline](#post-generation--web-pipeline)** before
   committing — the Raspberry Pi deploy target is unforgiving of multi-MB sources.
4. Save to the **Path** shown. Photographic assets → `public/images/`.

### The house style (already baked into every prompt — here for reference / tweaking)

```
warm documentary lifestyle photography, natural available light, soft golden window
daylight, gentle directional light with lifted warm espresso-brown shadows (never
crushed black), cozy small Thai church café, color grade warm and low-contrast with
amber/caramel highlights and cream (#FBF8F3) whites — warm white balance, never cool;
candid and unposed, real Thai people of mixed ages, shallow-to-medium depth of field,
generous negative space, subtle fine film grain, natural-plus saturation (not HDR)
```

### Global negative prompt (append to every generation that supports one)

```
no text, no watermark, no logo, no captions; no cheesy stock look, no fake toothy
laughter, no posed thumbs-up, no business handshake; no western megachurch, no stage
lights, no smoke, no raised-hands concert worship, no jumbotron; no religious kitsch,
no glowing cross, no sunbeams through clouds, no dove clip-art, no halos, no praying-
hands stock; no prices, no cash, no card reader, no QR/PromptPay pay, no tip jar; no
pure white #FFFFFF, no cool/blue white balance, no crushed black, no HDR, no neon, no
purple/pink AI gradient, no synthetic gradient sky; no non-Thai generic models
```

> **Palette** (for grading / duotone / overlays): cream `#FEFBF8` · latte foam `#FBF8F3`
> · espresso brown `#6F4E37` · dark roast text `#261D16` · toasted crema glow `#FAE4CC`
> · oat milk `#F6EDE0` · steam grey `#756960` · caramel `#C9A87C`.
> **Type** (only if a future asset bakes in text): **Sarabun**, Thai-first, then English.

---

## 1. Photographic assets

### 🔴 `hero-bg` — Landing hero background *(CRITICAL)*
- **Path:** `public/images/hero.webp` · **Aspect:** 16:9 (+ a 4:5 mobile crop) · **Target:** 2400×1350 · **Format:** webp
- **Where:** `components/landing/hero.tsx` (replaces the CSS gradient blobs, sits behind the H1)
- **Note:** keep the **left third calm and uncluttered** for the bilingual headline overlay; the existing `public/images/landing-hero.png` (church exterior) is an alternative if you prefer a real-place shot.

```
Warm documentary lifestyle photograph: the inviting interior of a small Thai church
café in Chonburi at golden hour, soft daylight pouring through a window onto a wooden
counter, a barista mid-pour creating latte art into a simple ceramic cup, one or two
Thai customers of different ages chatting at a cozy mismatched table in the soft-focus
background. Atmosphere of welcome and rest. Generous calm negative space on the left
for text. Natural available light, lifted warm espresso-brown shadows, cream highlights,
warm low-contrast color grade with amber/caramel tones, shallow depth of field, subtle
film grain, candid and unposed. Cinematic 16:9. No text, no signage text, no logo.
```

### 🟡 `story-photo` — "Our café story" panel *(IMPORTANT)*
- **Path:** `public/images/story.webp` · **Aspect:** 4:3 · **Target:** 1200×900 · **Format:** webp
- **Where:** `components/landing/story.tsx` (fills the 4:3 panel beside the story copy — currently a gradient)

```
Warm documentary close-up: two hands cradling a warm ceramic mug of coffee on a worn
wooden café table inside a small Thai church café, an open Bible resting naturally
nearby, soft window daylight, gentle steam rising. Intimate, restful, sincere — coffee
offered as a gift, not sold. Warm low-contrast grade, caramel highlights, cream tones,
lifted espresso-brown shadows, shallow depth of field, fine film grain. 4:3. No text.
```

### 🟡 `visit-us-church-photo` — Chonburi Church exterior *(IMPORTANT)*
- **Path:** `public/images/church-exterior.webp` · **Aspect:** 16:10 · **Target:** 1200×750 · **Format:** webp
- **Where:** `components/landing/visit-us.tsx` (pairs with the Google Map iframe + worship times)
- **Note:** for *true* recognizability, **photograph the real building** — `public/images/landing-hero.png` already holds an exterior shot. Use the prompt below only as a generated stand-in.

```
Warm welcoming photograph of the exterior of a modest small-city Thai church building
in Chonburi in soft late-afternoon tropical light, an open front door and a friendly
entrance, a couple of Thai people walking in, tidy street-level setting. Inviting,
grounded, neighborly — not grand. Warm color grade, cream and caramel tones, soft
shadows, natural light, gentle film grain. 16:10. No text, no readable signage.
```

### 🟡 `menu-item-default-placeholder` — menu fallback image *(IMPORTANT)*
- **Path:** `public/images/menu-placeholder.webp` · **Aspect:** 4:3 · **Target:** 800×600 · **Format:** webp
- **Where:** `app/(site)/menu/page.tsx` + `components/menu/menu-ordering.tsx` (shown when a menu item has no `imageUrl`)

```
Minimal warm product photograph of a single plain ceramic cup of coffee with simple
latte art, centered on a clean cream (#FBF8F3) surface, soft even daylight, lots of
calm negative space, gentle warm shadow. Neutral and timeless so it suits any drink.
Warm low-contrast grade, caramel highlights, subtle film grain. 4:3 top-down-ish.
No text, no price, no branding.
```

### 🟡 `menu-photo-coffee` — seed photos per coffee drink *(IMPORTANT)*
- **Path:** `public/images/menu/coffee-<slug>.webp` (one per seeded item) · **Aspect:** 4:3 · **Target:** 800×600 · **Format:** webp
- **Where:** seeded into `menuItems.imageUrl` (`lib/db/seed.ts`); admins later paste their own URLs.
- **Note:** swap `{DRINK}` for each item — e.g. *latte, americano, cappuccino, espresso, mocha, iced coffee*.

```
Appetizing warm product photograph of a {DRINK}, served in a simple ceramic cup (iced
drinks in a clear glass), on a wooden café table in soft natural window light, a few
coffee beans and a warm crema highlight, shallow depth of field, calm cream background
with negative space. Inviting and homemade, not commercial. Warm low-contrast grade,
caramel and toasted-crema tones, cream whites, fine film grain. 4:3. No text, no price.
```

### ⚪ `menu-photo-tea` / `menu-photo-pastry` — other menu categories *(nice-to-have)*
- **Path:** `public/images/menu/tea-<slug>.webp` · `public/images/menu/pastry-<slug>.webp` · **800×600 · webp**
- Reuse the `menu-photo-coffee` prompt, replacing `{DRINK}` with the tea (e.g. *Thai milk tea, green tea latte, chamomile*) or pastry (*butter croissant, banana cake slice, cookie*). Keep the same surface, light, and grade for a consistent grid.

### ⚪ `classes-teaser-photo` — free Saturday classes *(nice-to-have)*
- **Path:** `public/images/classes-teaser.webp` · **Aspect:** 4:3 (or 3:1 banner crop) · **Target:** 800×600 · **Format:** webp
- **Where:** `components/landing/classes-teaser.tsx`

```
Warm candid photograph of a relaxed free Saturday class inside a small Thai church
café: a Thai volunteer teaching a couple of Thai primary-school children English at a
wooden table, friendly and informal, a guitar leaning nearby. Soft natural daylight,
joyful and unposed, community-run feel. Warm low-contrast grade, cream and caramel
tones, soft shadows, film grain. 4:3. No text, no readable worksheet text.
```

### ⚪ `class-thumb-english` / `class-thumb-guitar` / `class-thumb-japanese` *(nice-to-have)*
- **Path:** `public/images/classes/<kind>.webp` · **Aspect:** 16:9 · **Target:** 800×450 · **Format:** webp
- **Note:** requires adding an `imageUrl` column to `classOfferings` + the admin dialog to wire these in. Prompts:
  - **English:** `Warm candid photo, a Thai volunteer and a young Thai child reading an English picture book together at a café table, soft daylight, joyful, community class. Warm grade, cream/caramel tones, film grain. 16:9. No text.`
  - **Guitar:** `Warm candid photo, a Thai teen learning acoustic guitar chords from a relaxed volunteer in a cozy café corner, soft window light. Warm grade, caramel tones, shallow DOF, film grain. 16:9. No text.`
  - **Japanese:** `Warm candid photo, a small informal basic-Japanese lesson at a café table, two Thai adults and a notebook, soft daylight, friendly. Warm grade, cream tones, film grain. 16:9. No text (no readable characters).`

### ⚪ `sanctuary-interior-photo` — worship hall interior *(nice-to-have)*
- **Path:** `public/images/sanctuary.webp` · **Aspect:** 3:2 · **Target:** 1200×800 · **Format:** webp
- **Note:** a low-res real shot already exists at `public/images/landing-featured.png` (500×333) — re-scan higher-res, or generate:

```
Warm inviting photograph of the simple interior worship hall of a modest Thai church,
soft natural daylight through windows, tidy rows of chairs, calm and peaceful, human-
scale (not an arena). Reassuring for a first-time visitor. Warm low-contrast grade,
cream and caramel tones, lifted soft shadows, film grain. 3:2. No text, no stage lights.
```

### ⚪ `first-visit-illustration` — optional step imagery *(nice-to-have)*
- **Path:** `public/images/first-visit-<n>.webp` · **Aspect:** 3:2 · **Target:** 600×400 · **Format:** webp
- Three small candid photos matching the steps: **(1)** a Thai person stepping through the café's open door; **(2)** a barista handing over a free coffee with a smile; **(3)** a warm worship gathering. Same house style, 3:2, no text.

---

## 2. Brand & icon assets

### 🟡 `site-wordmark-logo` — brand logo lockup *(IMPORTANT)*
- **Path:** `public/logo.svg` (+ a square `public/logo-mark.svg`) · **Aspect:** ~4:1 horizontal & 1:1 mark · **Format:** svg
- **Where:** `components/site-header.tsx` + `components/site-footer.tsx` (currently a generic Lucide coffee glyph)

```
Flat vector logo lockup for "Coffee & Gospel", a Thai church café. A simple, warm,
minimal mark fusing a coffee cup with a subtle, tasteful cross motif (understated, not
a glowing religious symbol) in espresso brown (#6F4E37) on transparent background.
Clean modern lines, friendly and hospitable, scalable. Provide a horizontal lockup
(icon left of a bilingual wordmark) and a standalone square icon. Vector, flat, 2-color
max (espresso brown + cream). No gradients, no 3D, no photorealism.
```

> Set the wordmark type in **Sarabun**, Thai name `คาเฟ่ & ข่าวประเสริฐ` first, `Coffee & Gospel` second.

### 🟡 App / favicon icon — `app/icon.png` *(IMPORTANT — replace the bloated current one)*
- **Path:** `app/icon.png` · **Size:** 512×512 source · **Format:** PNG, transparent, ≤50KB
- Export the square `logo-mark` above as a clean 512×512 PNG. Next.js auto-serves it as the favicon.
  > ⚠️ Today `app/icon.png`, `public/icon-192.png`, `public/icon-512.png` are **byte-identical 1024×1024 / 818KB** files — the 192/512 names are lies. Regenerate all three at their real sizes.

### 🟡 PWA icons — `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png` *(IMPORTANT)*
- **192:** 192×192 PNG transparent ≤20KB · **512:** 512×512 PNG transparent ≤60KB
- **Maskable (NEW):** 512×512 PNG, logo within the central **80% safe zone** (Android clips to a circle), opaque cream `#FBF8F3` background. Add to `app/manifest.ts` with `purpose: 'maskable'`.

### 🟡 Apple touch icon — `app/apple-icon.png` *(IMPORTANT — currently MISSING)*
- **Path:** `app/apple-icon.png` · **Size:** 180×180 · **Format:** PNG, **opaque** (iOS flattens alpha to black — bake a cream/brown background) ≤40KB
- Same mark on a solid cream `#FBF8F3` or espresso `#6F4E37` background, centered with safe-zone padding.

---

## 3. OG / social image — keep as-is ✅

`app/opengraph-image.tsx` generates the 1200×630 share image **at runtime** (warm gradient
`#FBF8F3 → #E9DDCB → #C9A87C` + site name/tagline). **No file to generate** — it stays in
sync with site content automatically. *Optional* future upgrade: composite a real café photo
behind the wordmark, but not required. (`favicon.ico` is also optional — `app/icon.png` covers modern browsers.)

---

## 4. Asset cleanup checklist (do this regardless of generation)

These orphaned files are referenced **nowhere** in code and waste space / risk the Pi build:

- [ ] `public/images/landing-hero.png` — **7.3MB**, 2720×2040. Either wire it in as the hero (convert to WebP ≤1920px wide) or **delete**.
- [ ] `public/images/landing-featured.png` — 500×333, 280KB, low-res sanctuary shot. Replace with a higher-res WebP if used, else delete.
- [ ] `public/images/image.png` — 2.4MB abstract light-rings, leftover. **Delete.**
- [ ] Replace the 3 byte-identical 818KB icon files (see §2).

---

## 5. Post-generation → web pipeline

The deploy target is a **Raspberry Pi (ARM64, ~1.5GB RAM, sharp, webp-only)**. Oversized
source images pin its CPU on first optimize, and `/tmp` is a small tmpfs. Keep sources lean.

```bash
# Photographic → WebP, capped width, quality ~82 (needs cwebp or sharp-cli)
cwebp -q 82 -resize 2400 0 hero.png        -o public/images/hero.webp        # ≤300KB
cwebp -q 82 -resize 1200 0 story.png       -o public/images/story.webp       # ≤150KB
cwebp -q 82 -resize 800  0 menu-latte.png  -o public/images/menu/coffee-latte.webp

# Icons → exact sizes (PNG)
sharp -i logo-mark.png -o app/icon.png         resize 512 512
sharp -i logo-mark.png -o public/icon-192.png  resize 192 192
sharp -i logo-mark.png -o public/icon-512.png  resize 512 512
sharp -i logo-mark.png -o app/apple-icon.png   resize 180 180 --background "#FBF8F3" flatten
```

**Size budgets:** icon source ≤50KB · icon-192 ≤20KB · icon-512/maskable ≤60KB ·
apple-icon ≤40KB · hero WebP ≤300KB · other photos ≤150KB.

**Wiring note:** local `public/` images can go through `next/image` (auto-WebP per
`next.config.mjs`). Admin-/seed-supplied **menu** image URLs render with a plain `<img>`
on purpose (no `remotePatterns` config for the Pi) — so menu seed photos should be
committed into `public/images/menu/` and referenced by local path.
