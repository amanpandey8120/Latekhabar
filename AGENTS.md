# AGENTS.md — Late Khabar Project Guidelines

This file provides permanent context, architecture guidelines, and behavioral instructions for AI coding agents working on the **Late Khabar** project.

---

## 1. Project Overview
- **Project Name:** Late Khabar
- **Application Type:** General-purpose modern editorial news web application.
- **Main Goal:** Deliver breaking, trending, national, international, and local regional news with bilingual support (Hindi & English), user personalization, bookmarking, and an administrative panel for news management.

---

## 2. Technology Stack
- **Frontend Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (v4) with Vanilla CSS tokens in `src/index.css`
- **Routing:** React Router (`react-router-dom` v7)
- **Backend & Auth:** Supabase (Authentication with Google Provider)
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage (Image assets & uploads)
- **Video Integration:** YouTube embeds for multimedia news reports

---

## 3. UI/UX Rules
- **Source of Truth:** Stitch UI/UX design specifications are the primary reference.
- **Preserve Existing Screens:** Do not redesign existing screens unless explicitly requested by the user.
- **Design System Integrity:** Maintain existing color palettes, typography (`Playfair Display`, `Inter`), spacing, utility components, and layouts.
- **Theme Support:** Support Light and Dark mode using class-based selector `.dark`.
- **Bilingual Support:** Support English and Hindi (`EN` / `हिन्दी`) toggling across all public screens and articles.
- **Responsiveness:** Maintain seamless Desktop, Tablet, and Mobile responsiveness.

---

## 4. Application Features
- **Home / Latest News Feed:** Hero featured story, top stories grid, trending widget, and multimedia section.
- **Trending News:** Curated high-engagement news feed.
- **National & International News:** Categorized news sections.
- **State / City / Local News Explorer:** Location-filtered news feed with state/city picker.
- **Search & Filtering:** Keyword search, category filtering, and location filters.
- **News Details:** Full article view with rich content, media, related stories, and bookmarking.
- **Google Authentication:** User sign-in/sign-out via Supabase Google OAuth.
- **User Profile:** Saved articles, user preferences, and profile details.
- **Bookmarks:** Save and manage articles for offline/later reading.
- **Admin Dashboard:**
  - News Article CRUD (Create, Read, Update, Delete)
  - Category Management
  - User & Role Management
  - Image/Video Media Upload & Management
  - Platform Analytics Overview

---

## 5. Architecture Rules
- **Component Reusability:** Build small, focused, reusable React components in `src/components/`.
- **Separation of Concerns:** Keep business logic outside UI components where possible.
- **Service Layer:** Centralize database operations and API calls inside `src/services/` (e.g., `newsService.ts`).
- **Centralized Authentication:** Manage auth state centrally in `src/context/AuthContext.tsx`.
- **Centralized Types:** Define all interfaces, types, and data models in `src/types/index.ts`.
- **DRY Principle:** Avoid code duplication across components and pages.
- **Scalable Directory Layout:**
  - `src/components/` (UI components grouped by domain: `common/`, `news/`, `admin/`)
  - `src/context/` (React contexts: `AuthContext`, `ThemeContext`, `LanguageContext`)
  - `src/layouts/` (Layout structures: `PublicLayout`, `AdminLayout`)
  - `src/pages/` (Page views: `public/`, `admin/`)
  - `src/services/` (Supabase and external API interactions)
  - `src/types/` (TypeScript declarations)
  - `src/lib/` (Configuration & client initialization: `supabase.ts`)

---

## 6. Security Rules
- **Secrets Management:** Never hardcode secrets or private API keys in code or commits.
- **Service-Role Keys:** Never expose Supabase service-role keys in frontend client code.
- **Environment Variables:** Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` via `import.meta.env`.
- **Row Level Security (RLS):** Enforce strict RLS policies in Supabase PostgreSQL for all tables.
- **Admin Authorization:** Never rely on email strings or frontend-only checks to determine admin permissions. Use database roles/claims (`user.role === 'admin'`) backed by RLS.
- **Route Protection:** Protect admin routes using explicit authentication and authorization guards.

---

## 7. Database Rules
- **Primary Storage:** Supabase PostgreSQL is the canonical database.
- **Production Data:** Do not rely on permanent mock or `localStorage` data for production features.
- **Queries & Performance:** Write optimized queries with proper indexing, filtering, and pagination.
- **Field Mapping:** Maintain clear mapping between database `snake_case` column names and TypeScript `camelCase` model attributes in the service layer.

---

## 8. Media Rules
- **Image Uploads:** Store article images, user avatars, and thumbnails in Supabase Storage buckets.
- **Video Content:** Use YouTube video embeds (`youtube.com/embed/...`) for video news reports.
- **Git Hygiene:** Never commit large video files or raw binary media to the Git repository.
- **Validation:** Validate file types (e.g., JPEG, PNG, WebP) and enforce maximum file size limits before upload.

---

## 9. Coding Rules
- **TypeScript First:** Enforce strict typing without fallback to `any` unless absolutely necessary.
- **Naming Conventions:** Use clear, descriptive names for components, variables, functions, and files.
- **UI State Handling:** Always handle loading, empty, and error states explicitly in components.
- **Lean Dependencies:** Avoid adding unneeded external packages; utilize existing libraries.
- **Targeted Edits:** Do not modify unrelated files or rewrite working functionality.
- **Architectural Rationale:** Explain the technical reasoning before executing major structural changes.

---

## 10. Responsive Rules
- **Breakpoints:**
  - **Mobile:** `320px – 767px`
  - **Tablet:** `768px – 1279px`
  - **Desktop:** `1280px+`
- **Layout Safety:** Prevent horizontal scrolling (`overflow-x-hidden`) across all viewports.
- **Touch Ergonomics:** Ensure touch targets (buttons, links, icon actions) are at least 44x44px on touch devices.

---

## 11. Development Workflow
1. **Inspect Codebase First:** Check existing files and implementations before introducing changes.
2. **Reuse Existing Utilities:** Leverage existing components and context hooks (`useTheme`, `useLanguage`, `useAuth`).
3. **Follow Stitch Guidelines:** Match UI implementations with Stitch design specs.
4. **Iterative Progress:** Implement one discrete feature or fix at a time.
5. **Runtime Verification:** Test and verify affected code paths after making edits.
6. **Minimize Disruption:** Keep code edits surgical, minimal, and focused on the prompt.

---

## 12. Important Current Status
- **UI/UX Design:** UI/UX layouts originate from Stitch designs.
- **Frontend Status:** React + Vite frontend is scaffolded and active.
- **Data Migration:** Some components currently use mock datasets; the ongoing objective is to systematically transition all features to real Supabase integration.

---

## 13. Agent Behavior
- **Self-Sufficiency:** Do not request details already documented in this `AGENTS.md` file.
- **Source Code Verification:** Inspect the workspace before generating or altering code.
- **No Hallucinated Symbols:** Do not invent non-existent APIs, database tables, or utility files.
- **Root Cause Debugging:** When addressing bugs, diagnose the root cause instead of applying superficial patches.
- **Preserve Functionality:** Keep working features intact unless the user explicitly requests modifications.
- **Token Efficiency:** Read only the files necessary to perform the requested task.
