# Design Brief: Register (`/register`)

## 1. Purpose
Provides account creation for new operators joining the Taskora workspace. Matches the exact aesthetic elegance and security posture of the sign-in experience.

## 2. Data
- **Input Fields:**
  - `displayName`: string, user's full name (minimum 2 characters)
  - `email`: string, valid email address
  - `password`: string, minimum 6 characters
- **Display Metadata:**
  - Taskora logo mark and branding
  - Localized copy explaining workspace setup

## 3. Actions
- Enter full name, email, and password.
- Submit registration form via primary "Create account" button.
- Toggle language switch (EN / AR) and theme switch (Light / Dark) in top bar.
- Link to login page (`/login`).

## 4. States
- **Default (Idle):** Empty fields with labels and placeholders.
- **Submitting (Loading):** Inputs locked, submit button exhibits loading state.
- **Validation Error:** Inline validation messages highlighting empty or invalid fields (e.g. name too short, invalid email, password < 6 chars).
- **Registration Error:** Server error alert (e.g. email already in use or network failure).

## 5. Layout requirements
- **Card Container:** Centered card (max width ~28rem / 448px) matching `/login` dimensions and styling.
- **Header:** Taskora brand monogram, heading "Create your Taskora account", brief subtitle.
- **Form Area:**
  - Full Name field
  - Email field
  - Password field
  - Full-width primary CTA button
- **Footer:** "Already have an account? Sign in" linking to `/login`.

## 6. Responsive
- **Desktop (≥ 1024px):** Centered floating card with calm background aura.
- **Tablet (768px - 1023px):** Centered card, 2rem margins.
- **Mobile (320px - 767px):** Full-width card with 1rem margin, touch-optimized inputs (≥ 44px height), zero horizontal scroll.

## 7. i18n & Theme
- **Bilingual:** All placeholders, labels, and error messages translated in Arabic and English dictionaries. Input directions adjust according to active language; name display wrapped in `<bdi>`.
- **Dual Themes:** Light and Dark mode support with matching elevation tiers and borders.

## 8. Out of scope
Forbidden phantom features:
- No Terms of Service / Privacy Policy checkboxes or legal links unless explicitly routed.
- No company size, role selection, team name, or multi-step onboarding wizard in auth screen.
- No social signup buttons (Google, Apple, Microsoft).
- No newsletter subscription opt-ins.
