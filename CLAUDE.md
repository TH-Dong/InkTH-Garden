# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal knowledge base website built with Next.js (App Router) + Tailwind CSS v4. Markdown-driven content, academic/engineering aesthetic, phased development.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build
- `npm run start` — Serve production build
- `npm run lint` — ESLint

## Architecture

- **Framework:** Next.js 16 with App Router, TypeScript, static generation (SSG)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`
- **Fonts:** Geist Sans + Geist Mono (via `next/font/google`)
- **Markdown:** unified + remark + rehype pipeline
- **Math:** remark-math + rehype-katex (KaTeX CSS imported in globals.css)
- **Code highlighting:** rehype-pretty-code (shiki, static — no runtime JS)
- **Heading IDs:** rehype-slug (auto-generates IDs for TOC linking)

### Directory Structure

```
src/
  app/
    layout.tsx                      — Root layout: Navbar + main + Footer
    page.tsx                        — Home page
    knowledges/
      layout.tsx                    — Three-column layout (sidebar + children)
      page.tsx                      — Knowledge root: category overview
      [...slug]/page.tsx            — Category page OR article page (auto-detected)
    blogs/
      page.tsx                      — Blog list
      [slug]/page.tsx               — Blog article
    readings/page.tsx               — Readings list
    projects/page.tsx               — Placeholder
    about/page.tsx                  — Placeholder
    globals.css                     — Global styles + Tailwind + KaTeX + prose
  components/
    Navbar.tsx                      — Top nav with active state
    Footer.tsx                      — Site footer
    EntryCard.tsx                   — Reusable link card
    home/Hero.tsx                   — Home hero section
    home/RecentSection.tsx          — Home recent notes (placeholder data)
    knowledge/Sidebar.tsx           — Left: category tree navigation
    knowledge/CategoryPage.tsx      — Center: category listing
    knowledge/ArticlePage.tsx       — Center: article content
    knowledge/ArticleNav.tsx        — Prev/next article navigation
    knowledge/Toc.tsx               — Right: table of contents
  lib/
    content/knowledges.ts           — getAllKnowledgePosts, getKnowledgeBySlug, getPostsByCategory, getAdjacentPosts
    content/knowledgeTree.ts        — getKnowledgeTree (directory → tree structure)
    content/blogs.ts                — getAllBlogs, getBlogBySlug
    content/readings.ts             — getAllReadings
    markdown/render.ts              — Markdown → HTML render pipeline
    toc/extractToc.ts               — Extract H2/H3 from HTML for TOC
  types/content.ts                  — KnowledgePost, BlogPost, Reading, TocItem, KnowledgeTreeNode
  content/                          — Markdown content source
    knowledges/{CS,Math,LLM}/       — Knowledge articles by category/subcategory
    blogs/                          — Blog posts
    readings/                       — Reading entries
```

### Key Patterns

- All pages share the root layout (Navbar + Footer)
- Knowledges section has its own layout with three-column structure (sidebar + main + TOC)
- `knowledges/[...slug]` handles both category pages and article pages: tries article match first, falls back to category listing
- Knowledge tree is generated from the filesystem directory structure
- TOC is extracted from rendered HTML heading IDs (rehype-slug)
- Prev/next navigation operates within the same subcategory
- Content reading logic is in `src/lib/content/`, completely separated from pages
- `.page-container` CSS class provides consistent max-width + padding (used by non-knowledge pages)
- `.prose` CSS class in globals.css styles rendered Markdown content

### Content frontmatter

Knowledge/Blog posts: `title`, `date`, `updated`, `tags`, `summary`, `draft`
Readings add: `author`, `cover`, `comment`, `noteLink`

## Development Phases

Work is done in strict phases. Each phase has a defined scope — do not exceed it.

## Design Context (via Impeccable)

### Users
Readers (including the author) engaging with deep technical content (CS, Math, LLM). The reading context requires focus and clarity, but the experience should feel exceptionally comfortable, fresh, and elegant.

### Brand Personality
**雅致 (Elegant)**, **清新 (Fresh)**, **大方 (Generous/Atmospheric)**.
The tone is refined and uncluttered without being boring. Never flashy or overly decorated, but contains thoughtful, eye-catching microscopic details ("亮眼之处").

### Aesthetic Direction
- **Visual Tone**: Elevated minimalism (简约大气).
- **Theme**: **Light Theme** focused.
- **Typography**: Elegant but highly legible. Moving away from standard utility sans-serifs into something more sophisticated.
- **Color**: A light, airy, and sophisticated palette using perpectually uniform OKLCH.

### Design Principles
1. **Elegant Restraint (雅致克制)**: Clean and unflashy, but with subtle richness in typography and spatial rhythm.
2. **Moments of Insight (亮眼细节)**: Refined micro-interactions and subtle color tints/typographic flourishes that support the content.
3. **Fresh & Airy Atmosphere (清新的呼吸感)**: Generous spacing, fluid layouts, and light colors to make reading complex topics effortless.
4. **Sophisticated Legibility (高雅且清晰)**: Distinct fonts that maintain extreme clarity.
