# Trustsure AI

Trustsure AI is a planned scam-detection project.

The goal is to help people recognise scam messages, suspicious links, and fraudulent requests before they become a problem.

This repository is in early development. The current prototype is a local device-control demo and does not yet include scam detection.

## Run the local prototype

On Windows, run `npm install`, `npm run build`, then `npm start` and open http://127.0.0.1:4173. The button opens a confirmation dialog; confirming schedules a restart of that PC after 30 seconds. You can cancel during the countdown.

For live-reloading development, keep `npm start` running and launch `npm run dev` in another terminal. The Vite page (usually http://127.0.0.1:5173) forwards API requests to the local server on port 4173.

For preview mode without actual restart, set `ENABLE_SYSTEM_RESTART=false` before starting the server (in PowerShell: `$env:ENABLE_SYSTEM_RESTART = 'false'; npm start`). On non-Windows systems the restart button remains disabled.
