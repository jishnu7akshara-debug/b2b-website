# Loadbay — B2B Services, Dev Agencies & Startups website

Premium static site: modern warehouse × rounded design, concrete / graphite / safety-orange palette (60-30-10),
GSAP + ScrollTrigger + Lenis animations. All photos, videos and JS libraries are stored locally in `/assets`, so nothing breaks.

## Run
- Double-click `start.bat` (opens http://localhost:5510), or
- `python -m http.server 5510` in this folder, or just open `index.html`.

## Structure
```
index.html          all sections (hero, who we serve, services, reel, work, process, partners, testimonials, pricing, FAQ, contact)
css/style.css       design system + responsive rules
js/main.js          loader, smooth scroll, reveals, pinned horizontal services, counters, slider, form
assets/img          Unsplash photos (free commercial licence)
assets/video        Mixkit videos (free commercial licence)
assets/vendor       gsap, ScrollTrigger, lenis
assets/fetch-assets.ps1   re-downloads media if ever needed
```

## Before going live
- Replace brand name, email/phone, client case studies, testimonials and stats (they are sample content).
- Connect the contact form in `js/main.js` (submit handler) to your backend / CRM.
