# Cook.io

Live site: https://cookio-esha.netlify.app/index.html

Cook.io is a responsive recipe web application built with HTML, CSS, vanilla JavaScript, Firebase, Netlify Functions, and a Python Flask backend option. It lets users discover recipes, view nutrition details, save favorite recipes, analyze saved recipe data, and predict recipe categories with a small ML-style classifier.

## Features

- Firebase authentication with login, signup, Google sign-in, and logout flow
- Root URL redirects to `login.html` for an auth-first experience
- Recipe discovery using Spoonacular data
- Secure Spoonacular API proxy so the API key is never exposed in browser DevTools
- Recipe search, filters, pagination, and infinite scroll support
- Recipe detail page with ingredients, servings, ready time, tags, and calories
- Nutrition-aware recipe saving, including calorie extraction
- Saved recipes page backed by Firebase/localStorage flow
- Saved recipe analytics for cuisine, diet, and calories
- Recipe category prediction page
- Predict button on recipe detail pages that pre-fills the recipe title
- Light/dark theme toggle
- Responsive desktop and mobile navigation
- Netlify deployment with serverless functions
- Optional Flask backend for local or separate Python hosting

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Authentication and storage: Firebase Auth and Firestore
- Recipe API: Spoonacular
- Production API layer: Netlify Functions
- Optional backend: Python Flask
- ML support: Python `joblib` model locally, Netlify keyword-based serverless predictor in production
- Deployment: Netlify

## Project Structure

```text
.
|-- assets/
|   |-- css/
|   |-- images/
|   `-- js/
|-- backend/
|   `-- app.js
|-- backend_flask/
|   |-- app.py
|   |-- requirements.txt
|   `-- Procfile
|-- netlify/
|   `-- functions/
|       |-- health.js
|       |-- predict-category.js
|       |-- recipe.js
|       `-- search.js
|-- detail.html
|-- index.html
|-- login.html
|-- predict.html
|-- recipes.html
|-- saved-recipes.html
|-- netlify.toml
|-- .env.example
`-- recipe_category_model.pkl
```

## Main Pages

- `login.html`: user login, signup, and Google sign-in
- `index.html`: authenticated home page with recipe sections and search
- `recipes.html`: recipe listing, filters, load more, and infinite scroll
- `detail.html`: full recipe details, calories, ingredients, save button, and predict button
- `saved-recipes.html`: saved recipes and analytics
- `predict.html`: recipe category prediction interface

## API Endpoints

In production, the frontend calls same-origin `/api/*` endpoints. Netlify rewrites those requests to functions in `netlify/functions`.

```text
GET  /api/health
GET  /api/search
GET  /api/recipe/:id
POST /api/predict-category
```

The Spoonacular key is appended only inside the serverless functions or Flask backend. The browser should only show `/api/...` requests, never `apiKey=` or `api.spoonacular.com`.

## Environment Variables

Create a local `.env` file from `.env.example`.

```env
SPOONACULAR_KEY=your_spoonacular_api_key_here
PORT=5000
FLASK_DEBUG=false
```

For Netlify production, add this variable in Netlify:

```env
SPOONACULAR_KEY=your_spoonacular_api_key_here
```

Do not commit `.env`. It is ignored by `.gitignore`.

## Local Development

### Netlify-style local development

Install Netlify CLI:

```powershell
npm install -g netlify-cli
```

Run the site with Netlify Functions:

```powershell
netlify.cmd dev
```

On Windows PowerShell, `netlify.cmd` avoids script execution policy issues.

### Flask backend local development

The Flask backend is available as an optional backend/proxy.

```powershell
pip install -r backend_flask\requirements.txt
python backend_flask\app.py
```

Flask exposes:

```text
GET  /api/health
GET  /api/search
GET  /api/recipe/<id>
POST /api/predict-category
```

## Deployment

This project is configured for Netlify.

`netlify.toml`:

```toml
[build]
  publish = "."
  functions = "netlify/functions"

[[redirects]]
  from = "/api/recipe/:id"
  to = "/.netlify/functions/recipe/:id"
  status = 200

[[redirects]]
  from = "/api/search"
  to = "/.netlify/functions/search"
  status = 200

[[redirects]]
  from = "/api/health"
  to = "/.netlify/functions/health"
  status = 200

[[redirects]]
  from = "/api/predict-category"
  to = "/.netlify/functions/predict-category"
  status = 200

[[redirects]]
  from = "/"
  to = "/login.html"
  status = 302
  force = true
```

Deploy:

```powershell
netlify.cmd login
netlify.cmd link
netlify.cmd env:set SPOONACULAR_KEY "your_real_spoonacular_key_here"
netlify.cmd deploy --prod
```

After deployment, verify:

```text
https://your-site.netlify.app/api/health
https://your-site.netlify.app/api/search?query=pasta&number=1
https://your-site.netlify.app/api/recipe/716429?includeNutrition=true
```

## GitHub Upload

Initialize and push:

```powershell
git status --short
git add .
git commit -m "Initial Cook.io deployment-ready version"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin master
```

If your GitHub repository uses `main`:

```powershell
git branch -M main
git push -u origin main
```

## Security Notes

- `.env` is ignored and should never be committed.
- Spoonacular requests are proxied through `/api/*`.
- Firebase frontend config includes a public Firebase API key. This is normal for Firebase web apps, but Firebase Authorized Domains and Firestore Security Rules should be configured properly.
- Netlify environment variables must be set in the Netlify dashboard or CLI.

## Notes

- The Netlify prediction function is lightweight and serverless-friendly.
- The Python `recipe_category_model.pkl` model can be used through the Flask backend when running or deploying the Flask service separately.
- The Express/MySQL backend in `backend/` supports login analytics-related endpoints for local backend experiments.
