# Design Brief: Login (`/login`)

## 1. Purpose
Provides authentication access for returning users entering the Taskora workspace. Centered, calm, secure, and focused on frictionless entry.

## 2. Data
- **Input Fields:**
  - `email`: string, valid email format
  - `password`: string, minimum 6 characters
- **Display Metadata:**
  - Brand identity: Taskora logo monogram, title "Taskora"
  - Locale-specific greeting and instructional copy

## 3. Actions
- Fill email and password.
- Submit credentials via "Sign in" button.
- Toggle language switch (EN / AR) and theme switch (Light / Dark) in the top utility bar.
- Link to register page (`/register`).

## 4. States
- **Default (Idle):** Empty inputs with clear labels and helpful placeholders.
- **Submitting (Loading):** Form inputs disabled, primary submit button shows accessible loading indicator, prevents duplicate requests.
- **Validation Error:** Inline field-level error messages (e.g. invalid email format) without submitting.
- **Authentication Error:** Top-level error alert banner describing authentication failure (e.g. invalid credentials or network error) with retry capability.

## 5. Layout requirements
- **Card Container:** Cleanly centered authentication card (max width ~28rem / 448px) floating with subtle elevation on a neutral backdrop.
- **Top Utility Bar:** Minimalist top anchor containing brand logo, language toggle, and theme toggle.
- **Card Header:** Taskora logo mark, clear heading "Sign in to Taskora", supportive subheading.
- **Form Area:** Stacked vertical layout:
  - Email label and input
  - Password label and input
  - Full-width high-contrast primary submit button
- **Card Footer:** Secondary navigation link "Don't have an account? Sign up".

## 6. Responsive
- **Desktop (≥ 1024px):** Centered floating card with generous whitespace and vertical centering.
- **Tablet (768px - 1023px):** Centered card with comfortable 2rem padding.
- **Mobile (320px - 767px):** Full-bleed or card with 1rem margins, touch targets ≥ 44px, virtual keyboard friendly spacing.

## 7. i18n & Theme
- **Bilingual:** Form labels, validation errors, and button copy fully localized in Arabic and English. Text direction aligns dynamically (`dir="rtl"` / `dir="ltr"`).
- **Dual Themes:** Light mode has clean crisp card on soft slate canvas; Dark mode uses deep midnight surfaces (`#0f172a`) with subtle 1px border.

## 8. Out of scope
Forbidden phantom features:
- No third-party OAuth/SSO buttons (Google, GitHub, SAML) unless actively backed by Firebase configuration.
- No "Forgot password" or password reset workflows (not supported in current Firebase Auth scope).
- No "Remember me" persistent device cookies beyond standard Firebase session management.
- No Captcha challenges, 2FA prompt screens, or SMS verification.
