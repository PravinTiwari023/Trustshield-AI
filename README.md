# Trustshield AI

A React device-control interface with an explicit, confirmed local Windows restart action.

## Run in preview mode

Requires Node.js 20.19+ and npm.

```powershell
npm install
npm run build
npm start
```

Open **http://127.0.0.1:4173**. Restart is disabled by default.

## Enable real restart on your own Windows PC

Save your work first. Stop the preview server, then run:

```powershell
$env:ENABLE_SYSTEM_RESTART = 'true'
npm start
```

Click **Restart this PC**, read the confirmation, and click **Confirm restart**. Windows schedules a real restart in 30 seconds. **Cancel restart** aborts it during that countdown. Windows timed shutdown can close applications and lose unsaved work. You can also abort a pending Windows restart using `shutdown /a` in a terminal.

The server must remain running to use its cancel button. Closing the browser or server does not cancel an already scheduled Windows restart. The restart affects the computer running the backend. Do not expose this server through a tunnel or public hosting.

## UI development

`npm run dev` starts the Vite UI preview. Device actions require the built app served through `npm start` at the exact local address above.

The backend binds only to loopback and validates Host, Origin, a per-process token, and explicit confirmation. It uses fixed executable arguments, with no user-supplied shell commands.
