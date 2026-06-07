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
- `Settings`
- `AuditLog`

Share the spreadsheet with every Google account that should use the app.

## Environment Variables

Create a `.env` file for local development:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_DEFAULT_SPREADSHEET_ID=your-google-spreadsheet-id
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
npm install
```

## Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Build

```bash
npm run build
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

Users sign in with Google OAuth. The app does not permanently store Google access tokens. The signed-in Google account must have access to the spreadsheet.

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
