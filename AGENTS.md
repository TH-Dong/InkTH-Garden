# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 App Router site written in TypeScript. Route files live in `src/app`, including section pages such as `blogs`, `knowledges`, `readings`, `about`, and `projects`. Reusable UI belongs in `src/components`, grouped by feature (`blog`, `knowledge`, `home`, `readings`, `theme`). Markdown content is stored in `src/content/{blogs,knowledges,readings}`. Content loading and rendering utilities live in `src/lib`, and shared types are in `src/types`. Static assets such as avatars and article images belong in `public/`.

## Build, Test, and Development Commands
- `npm run dev` starts the local dev server at `http://localhost:3000`.
- `npm run build` creates a production build and catches type or route-level issues.
- `npm run start` serves the production build locally.
- `npm run lint` runs ESLint with the Next.js core-web-vitals and TypeScript configs.

Run `npm install` before first use. Prefer validating changes with `npm run lint` and `npm run build` before opening a PR.

## Coding Style & Naming Conventions
Use TypeScript with `strict` mode assumptions and the `@/*` import alias from `tsconfig.json`. Follow the existing style: 2-space indentation, double quotes, semicolons, and small focused modules. Name React components in PascalCase (`ArticlePage.tsx`), utility modules in camelCase (`extractToc.ts`), and route folders using Next.js conventions (`[slug]`, `[...slug]`). Keep content filenames stable and descriptive because slugs are derived from filenames.

## Testing Guidelines
There is no dedicated test suite in this workspace snapshot yet. Treat `npm run lint` and `npm run build` as the minimum verification gate for every change. When adding tests, place them outside `node_modules`, use `*.test.ts` or `*.test.tsx`, and keep them close to the feature they cover or under a top-level `tests/` directory.

## Commit & Pull Request Guidelines
Git history is not available in this workspace snapshot, so no repository-specific commit convention can be confirmed. Use short imperative commit messages, preferably with Conventional Commit prefixes such as `feat:`, `fix:`, or `docs:`. PRs should include a concise summary, affected routes or content paths, verification steps, and screenshots for visible UI changes.

## Content & Configuration Notes
Markdown frontmatter drives listings and metadata. Preserve fields such as `title`, `date`, `updated`, `tags`, `summary`, and `draft`; readings may also include `author`, `cover`, `comment`, and `noteLink`. Do not commit `.next/` output or generated local artifacts.
