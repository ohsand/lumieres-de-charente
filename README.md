# Lumières de Charente – website

Static multilingual site (EN · FR · NL · DE · 繁中) built with Astro, hosted on Vercel.

- `src/data/settings.json` – season look (auto/summer/winter), contact details, home photos
- `src/data/gites.json` – beds, photos, video links and weekly prices per gîte
- `src/data/prices.json` – season dates
- `src/content/{gites,pages,blog}/<lang>/` – all texts, one folder per language
- `src/i18n/ui.ts` – menu, buttons and form labels
- `/admin/` – Decap CMS editing screen with a simple password login (no GitHub account needed).
  Vercel environment variables: `ADMIN_PASSWORD` (comma-separate several) and `GITHUB_REPO_TOKEN`
  (fine-grained GitHub token, only this repository, Contents: read & write). Changing either takes effect after a redeploy.

Preview the winter look on any page with `?season=winter`.

```
npm install
npm run dev     # local preview
npm run build   # output in dist/
```
