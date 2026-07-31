# MIDAS IT Europe Sales Forecast

Static React sales forecast app using Google Sheets as the shared data backend.

There is no Express server, SQLite database, Supabase, Firebase, or cloud database service beyond the Google Spreadsheet selected by the signed-in user.

## Google Sheets Structure

Create one Google Spreadsheet named:

```text
MIDAS Sales Forecast Database
```

The app will create/use these tabs:

- `Teams`
- `Deals`
- `MonthlyGoals`
- `UserRoles`
- `Settings`
- `AuditLog`

The app records deal changes in `AuditLog` by default so the **What Changed**
tab can show new deals, forecast changes, moved deals, wins, losses, and
deletions. Set `VITE_ENABLE_AUDIT_LOG=false` only if change history must be
disabled.

Share the spreadsheet with every Google account that should use the app.

The first signed-in Google account is automatically added to `UserRoles` as a `Manager` when the sheet is empty. After that, access is controlled by rows in `UserRoles`.

## Environment Variables

Create a `.env` file for local development:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_DEFAULT_SPREADSHEET_ID=your-google-spreadsheet-id
VITE_MANAGER_COMMENT_UNLOCK_CODE=your-manager-comment-unlock-code
# Optional: set to false only when deal change history must be disabled
VITE_ENABLE_AUDIT_LOG=true
```

The Google OAuth client must allow the deployed site origin, for example:

```text
http://localhost:5173
https://your-app.vercel.app
```

Required OAuth scope:

```text
https://www.googleapis.com/auth/spreadsheets
```

## Install

```bash
pnpm install
```

## Run Locally

```bash
pnpm run dev
```

Open:

```text
http://localhost:5173
```

## Build

```bash
pnpm run build
```

## Preview Production Build

```bash
npm start
```

## Deploy

Deploy the static Vite app to:

- Vercel
- Netlify
- GitHub Pages
- any static hosting platform

Set these hosting environment variables:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_DEFAULT_SPREADSHEET_ID`

## Authentication

Users sign in with Google OAuth. The signed-in Google account must have access to the spreadsheet and must be listed in `UserRoles` after first setup. Google access tokens are stored in browser storage until sign-out or expiry, so use HTTPS hosting and sign out on shared devices.

## Appearance Themes

The appearance picker includes 18 token-based themes grouped as Core,
Professional, Colour, and Accessibility. Each theme coordinates application
surfaces, typography, borders, actions, status colours, focus states, and chart
colours. The selection is stored in the browser for the next visit.

## CSV Import / Export

Use the header import/export controls for:

- Teams CSV
- Deals CSV
- Monthly Goals CSV

CSV import shows a validation preview before writing to Google Sheets:

- rows to add
- rows to update
- duplicate rows
- rows with errors

Rows with errors are not imported.

## JSON Backup / Restore

JSON backup exports:

- Teams
- Deals
- MonthlyGoals
- Settings

JSON restore replaces those sheets in Google Sheets. JSON is the safest full recovery format. CSV is mainly for Excel editing of business records.

## Spreadsheet Configuration

The Spreadsheet ID is configured with `VITE_DEFAULT_SPREADSHEET_ID`. There is no user-facing Settings tab, so normal users cannot switch the connected Google Sheet inside the app.
