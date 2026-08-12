# Atyantik Songs

A "new tab" style dashboard themed around Indian truck art, with a working
horn (Web Audio, no assets needed) and a live YouTube player wired to the
**Indian Highway Songs** playlist (`PLLJOKBQMpmd8`, 156 tracks) using the
real YouTube IFrame Player API — play/pause, next/previous, and a seekable
progress bar all control actual playback.

> Note: this only plays inline once it's running on a real domain (e.g.
> your Vercel URL). YouTube's embedded player rejects sandboxed/opaque
> preview origins, which is why it needs to be deployed rather than run
> inside a chat preview.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Deploy to Vercel

**Option A — Vercel CLI**

```bash
npm install -g vercel
vercel
```

Follow the prompts (framework preset: **Vite**, build command:
`npm run build`, output directory: `dist`). Running `vercel` again after
your first deploy will give you a stable production URL with `vercel --prod`.

**Option B — Git + Vercel dashboard**

1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Vite — just click **Deploy**.

## Project structure

```
horn-ok-please/
├── index.html          # Vite entry HTML
├── src/
│   ├── main.jsx         # React root
│   ├── App.jsx          # All UI + YouTube player logic
│   └── index.css        # Styles
├── public/
│   ├── scene.webp             # Background truck scene
│   ├── steering-wheel.webp    # Horn button artwork
│   └── playlist-thumb.jpg     # Fallback player thumbnail
├── package.json
└── vite.config.js
```

## Customizing the playlist

Change `PLAYLIST_ID` at the top of `src/App.jsx` to point at a different
YouTube playlist.
