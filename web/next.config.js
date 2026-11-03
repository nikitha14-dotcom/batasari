const path = require("path");

// Next.js only loads .env files from this directory (/web), never from the repo
// root. Without this line the shared root .env is invisible to the browser
// bundle: NEXT_PUBLIC_SUPABASE_URL comes back undefined and every auth call
// silently no-ops with no error in the console.
//
// Loading the root file here rather than adding a second /web/.env keeps ADR
// 0004 intact -- one .env.example fixes every variable name, in one place.
// dotenv does not overwrite variables that are already set, so Vercel's real
// environment variables still win in a deployed build.
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hide the Next.js developer-tools badge from local app previews.
  devIndicators: false,
  // Image optimizer off until the Next 15.5.24+ upgrade: GHSA-2xp9-vwfh-vxw4 is
  // RCE through it, and nothing here uses next/image. ADR 0007, "Exception".
  images: { unoptimized: true },
};

module.exports = nextConfig;

