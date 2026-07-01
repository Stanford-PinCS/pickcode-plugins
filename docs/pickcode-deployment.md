# PinCS Pickcode Plugins Deployment Guide

This is a start-to-finish runbook for deploying `pickcode-plugins` to the PinCS production server, including the exact troubleshooting steps we used.

---

## What this guide is for

Use this when you have already merged plugin changes to `main` in:

- `Stanford-PinCS/pickcode-plugins`

and now need those changes live on:

- `https://pincs.stanford.edu/pickcode-plugins/...`

---

## Server locations and process names

- **Plugins repo on server:** `/var/www/html/pickcode-plugins`
- **Lessons app repo on server (separate):** usually `/var/www/html/interactive-lessons` (or environment-specific variant)
- **PM2 process names:**
  - `plugins` -> pickcode plugin host
  - `prod` -> interactive lessons production app
  - `dev` -> interactive lessons dev app

Why this matters: deleting/restarting the wrong PM2 process can take down the lessons app even if plugins are fine.

---

## Quick deploy commands (happy path)

Run on the server (`ssh <SUNET>@pincs.stanford.edu`):

```bash
cd /var/www/html/pickcode-plugins
source setup-backend.sh
pm2 delete plugins
git pull
npm install
npm run build:plugins
pm2 start "npm run preview:plugins -- --configLoader runner" --name plugins --update-env
pm2 status
```

Then verify:

```bash
curl -I http://127.0.0.1:5173/pickcode-plugins/plugins-manifest.json
```

and in browser:

- `https://pincs.stanford.edu/pickcode-plugins/plugins-manifest.json`

---

## Full deployment checklist (with why)

1. **Merge PR to `main` in `pickcode-plugins`.**
   - Why: server pulls from `main`.

2. **SSH to PinCS server and enter the correct repo.**
   - `cd /var/www/html/pickcode-plugins`
   - Why: commands must run in plugin repo, not lessons repo.

3. **Load backend env for that directory.**
   - `source setup-backend.sh`
   - Why: sets `PATH`, `PM2_HOME`, npm cache, and server-specific runtime setup.

4. **Stop existing plugin process before redeploy.**
   - `pm2 delete plugins`
   - Why: avoids restart loops and stale runtime.

5. **Pull latest code.**
   - `git pull`
   - If needed for ownership/safe directory issues, see troubleshooting below.

6. **Install deps and build.**
   - `npm install`
   - `npm run build:plugins`  **(important)**
   - Why: plugins mode sets base path for `/pickcode-plugins/`; plain `npm run build` can break embedded assets.

7. **Start plugins with PM2.**
   - `pm2 start "npm run preview:plugins -- --configLoader runner" --name plugins --update-env`
   - Why: starts preview server on port `5173` with environment loaded and avoids Vite config-loader temp-file permission failures seen in PM2.

8. **Verify health.**
   - Local on server:
     - `curl -I http://127.0.0.1:5173/pickcode-plugins/plugins-manifest.json`
   - Public:
     - `https://pincs.stanford.edu/pickcode-plugins/plugins-manifest.json`

9. **Verify specific plugin artifact exists.**
   - Example:
     - `https://pincs.stanford.edu/pickcode-plugins/plugins-code/haber-reaction/languages/BasicJS/implementation.js`
   - Why: confirms implementation file is actually deployed.

10. **Use plugin in lesson-maker.**
    - Pickcode block -> plugin type `Other` -> plugin id `haber-reaction` (or your plugin id).
    - Save/publish lesson.

---

## Troubleshooting playbook

### 1) `Service Unavailable` at `/pickcode-plugins`

Meaning: Apache route exists but backend may be down or path mismatch.

Check:

```bash
curl -k -I https://127.0.0.1/pickcode-plugins/plugins-manifest.json -H "Host: pincs.stanford.edu"
```

- If this returns `200`, Apache path is working.
- If public URL still fails, check plugin process and Apache conf.

---

### 2) `pm2` process `plugins` keeps restarting / `errored`

Check logs:

```bash
source setup-backend.sh
pm2 logs plugins --lines 80 --nostream
```

Common cause observed: permissions in `node_modules/.vite-temp`.

---

### 3) `EACCES: permission denied ... node_modules/.vite-temp/...`

This exact error caused the crash loop.

Fix:

```bash
cd /var/www/html/pickcode-plugins
source setup-backend.sh
pm2 delete plugins
sudo chown -R <your_user>:users /var/www/html/pickcode-plugins
rm -rf node_modules
npm install
npm run build:plugins
pm2 start "npm run preview:plugins -- --configLoader runner" --name plugins --update-env
```

Why: Vite preview needs write access to temporary config files.

---

### 4) Lesson loads but Run does nothing; console shows 404 for `/assets/index-...`

Likely cause: built with wrong command (`npm run build` instead of `npm run build:plugins`).

Fix:

```bash
npm run build:plugins
pm2 restart plugins --update-env
```

Why: plugins build must use base path `/pickcode-plugins/`.

---

### 5) `curl 127.0.0.1:5173` fails from your laptop

`127.0.0.1` points to your own machine, not server.

Run that curl on server SSH session (`<user>@pincs`) instead.

---

### 6) `pm2: command not found`

Run:

```bash
source setup-backend.sh
```

Then re-run `pm2` command.

---

### 7) `git pull` fails with safe directory / ownership errors

Possible fixes:

```bash
git config --global --add safe.directory /var/www/html/pickcode-plugins
sudo chown -R <your_user>:users /var/www/html/pickcode-plugins
```

Then retry `git pull`.

---

## Verification checklist before you call it done

- [ ] `pm2 status` shows `plugins` as `online` and stable (not rapidly increasing restarts).
- [ ] `https://pincs.stanford.edu/pickcode-plugins/plugins-manifest.json` loads.
- [ ] New plugin key appears in manifest (e.g., `haber-reaction`).
- [ ] Plugin implementation URL loads.
- [ ] Lesson-maker Pickcode block points at correct plugin id.
- [ ] Running lesson executes expected plugin behavior.

---

## Important distinction

- **PinCS deployment** (`pincs.stanford.edu/pickcode-plugins`) is controlled by this server workflow.
- **Pickcode's own production environment** (`pickcode.io`) is a separate release process owned by the Pickcode team.
