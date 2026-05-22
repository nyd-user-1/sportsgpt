This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Recovering archived scripts / scrapes

Old ingest scripts and raw scrape JSON files (`scripts/scraped/`) have been removed from the working tree once their data was successfully ingested into the database. They remain in git history forever; recover with the commands below.

### Find the commit that removed a file

```bash
git log --diff-filter=D --oneline -- scripts/scraped/east-islip-2024.json
```

This prints the SHA(s) where the file was deleted. The file lives in the **parent** of that SHA.

### Restore a single file

```bash
# replace <sha> with the deletion commit; ^ means "the parent"
git show <sha>^:scripts/scraped/east-islip-2024.json > scripts/scraped/east-islip-2024.json
```

### Restore the whole `scripts/scraped/` folder

```bash
git log --diff-filter=D --oneline -- scripts/scraped/ | head -1   # find deletion sha
git checkout <sha>^ -- scripts/scraped/                            # bring back every file
```

### Restore an old ingest/scrape script

Same pattern with a different path:

```bash
git log --diff-filter=D --oneline -- scripts/scrape-boxscores.mjs
git checkout <sha>^ -- scripts/scrape-boxscores.mjs
```

The DB tables `game_box_scores`, `player_rosters`, and `player_game_stats` are the source of truth — recover scripts/scrapes only if you need to re-ingest from raw, regenerate the JSON for a new use, or reference the original parser.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
