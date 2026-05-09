from flask import Flask, jsonify, request, Response
from dotenv import load_dotenv
import os
import requests
from flask_cors import CORS

try:
    import joblib
except ImportError:
    joblib = None

load_dotenv()

SPOONACULAR_KEY = os.getenv("SPOONACULAR_KEY") or os.getenv("SPOONACULAR_API_KEY")
SPOONACULAR_BASE_URL = "https://api.spoonacular.com/recipes"
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_PATH = os.getenv("RECIPE_MODEL_PATH") or os.path.join(BASE_DIR, "recipe_category_model.pkl")
LABEL_MAP = {
    0: "Breakfast",
    1: "Lunch",
    2: "Dinner",
}

model = None
if joblib:
    try:
        model = joblib.load(MODEL_PATH)
    except Exception:
        model = None

app = Flask(__name__)

allowed_origins = os.getenv("CORS_ORIGINS")
if allowed_origins:
    CORS(app, origins=[origin.strip() for origin in allowed_origins.split(",") if origin.strip()])
else:
    CORS(app)


def build_params(defaults=None):
    """Copy browser query params and append the API key only on the server."""
    params = dict(defaults or {})
    for key in request.args.keys():
        if key.lower() == "apikey":
            continue
        values = request.args.getlist(key)
        params[key] = ",".join(values) if len(values) > 1 else values[0]

    params["apiKey"] = SPOONACULAR_KEY
    return params


def forward_request(url, params=None):
    if not SPOONACULAR_KEY:
        return jsonify({"error": "Missing SPOONACULAR_KEY on server"}), 500

    try:
        resp = requests.get(
            url,
            params=params,
            timeout=15,
            headers={"Accept": "application/json"},
        )
        content_type = resp.headers.get("Content-Type", "application/json")
        return Response(resp.content, status=resp.status_code, content_type=content_type)
    except requests.RequestException as e:
        return jsonify({"error": "Spoonacular request failed", "detail": str(e)}), 502


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "model_loaded": bool(model)})


@app.get("/api/search")
def search():
    """Proxy endpoint for Spoonacular complexSearch.
    Accepts the same query params as Spoonacular and appends the API key server-side.
    """
    params = build_params({
        "addRecipeInformation": "true",
        "number": "20",
    })
    target = f"{SPOONACULAR_BASE_URL}/complexSearch"
    return forward_request(target, params=params)


@app.get("/api/recipe/<int:recipe_id>")
def recipe(recipe_id):
    """Proxy endpoint for Spoonacular recipe information.
    Example: /api/recipe/12345?includeNutrition=true
    """
    params = build_params({"includeNutrition": "true"})
    target = f"{SPOONACULAR_BASE_URL}/{recipe_id}/information"
    return forward_request(target, params=params)


@app.post("/api/predict-category")
def predict_category():
    if model is None:
        return jsonify({"error": "model not available on server"}), 503

    if not request.is_json:
        return jsonify({"error": "expected JSON body with 'text' field"}), 400

    data = request.get_json(silent=True) or {}
    text = data.get("text")
    if not text or not isinstance(text, str):
        return jsonify({"error": "missing or invalid 'text' field"}), 400

    try:
        prediction = model.predict([text])[0]
        label = LABEL_MAP.get(prediction, str(prediction))
        return jsonify({"predicted_category": label})
    except Exception as e:
        return jsonify({"error": "prediction failed", "detail": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host='0.0.0.0', port=port, debug=debug)
