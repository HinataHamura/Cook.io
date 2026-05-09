# Cook.io Deployment

## Production on Netlify

This project is ready to deploy as a static Netlify site with Netlify Functions.
The browser calls same-origin endpoints such as `/api/search` and `/api/recipe/123`.
Netlify rewrites those requests to the serverless functions in `netlify/functions`.

### 1. Required Netlify environment variable

In Netlify:

1. Open your site.
2. Go to **Site configuration** > **Environment variables**.
3. Add:

```env
SPOONACULAR_KEY=your_real_spoonacular_key_here
```

Do not add the Spoonacular key to frontend JavaScript, HTML, or Firebase config.

### 2. Netlify build settings

Use these settings:

```text
Build command: leave empty
Publish directory: .
Functions directory: netlify/functions
```

These are also defined in `netlify.toml`.

### 3. Deploy from this machine

After logging in and linking the site:

```powershell
netlify.cmd login
netlify.cmd link
netlify.cmd env:set SPOONACULAR_KEY "your_real_spoonacular_key_here"
netlify.cmd deploy --prod
```

### 4. Verify after deploy

Open these URLs on your deployed site:

```text
https://your-site.netlify.app/api/health
https://your-site.netlify.app/api/search?query=pasta&number=1
https://your-site.netlify.app/api/recipe/716429?includeNutrition=true
```

In browser DevTools, the Network tab should show `/api/...` requests only.
It should not show `apiKey=` or `api.spoonacular.com`.

## Local Development

### Option A: Netlify-style local development

Install and run the Netlify CLI:

```powershell
npm install -g netlify-cli
netlify.cmd dev
```

Add `SPOONACULAR_KEY` to `.env` first. Netlify Dev will load it and serve the
site with local functions.

On this Windows machine, use `netlify.cmd` instead of `netlify` because
PowerShell blocks the generated `.ps1` shim by default.

### Option B: Flask backend local development

The Flask backend is still available in `backend_flask`.

```powershell
pip install -r backend_flask\requirements.txt
python backend_flask\app.py
```

For production, deploy Flask separately only if you prefer a Python service over
Netlify Functions. If you do, update `netlify.toml` redirects to point `/api/*`
to your deployed Flask URL.
