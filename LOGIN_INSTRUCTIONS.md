# Login Page Setup Instructions

The login page has been implemented at `/auth/login`.

## Setup Required

To make the login functional, you must configure your Supabase credentials.

1.  Open `.env.local` in the root directory.
2.  Add your Supabase project URL and Anon Key:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    ```

3.  Restart the development server: `npm run dev`.

The application currently uses dummy values (`https://example.com`) as a fallback to allow the build to pass without errors. Once you add the environment variables, they will take precedence.

## Features Implemented

-   **Logic/UI Separation**:
    -   `app/auth/login/useLoginLogic.ts`: Handles authentication logic.
    -   `app/auth/login/LoginForm.tsx`: Handles UI and design.
-   **Design**:
    -   Split screen layout (Splash art left, Form right).
    -   "Moj Kutak" branding with logo.
    -   Responsive design (mobile-friendly).
    -   Wait/Loading states.
    -   Password visibility toggle.

## Testing

1.  Navigate to `/auth/login`.
2.  Enter credentials.
3.  Click "LOGUJ SE".
4.  If credentials are valid, you will be redirected to `/`.
