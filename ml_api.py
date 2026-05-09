from flask import Flask, request, jsonify
import joblib
import logging

app = Flask(__name__)

# basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_api")

# Try to load trained model
model = None
try:
    model = joblib.load("recipe_category_model.pkl")
    logger.info("Model loaded successfully.")
except Exception as e:
    logger.warning("Could not load model: %s", e)

LABEL_MAP = {
    0: "Breakfast",
    1: "Lunch",
    2: "Dinner"
}


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.route("/", methods=["GET"])
def health():
    """Simple health endpoint to confirm server is running."""
    return jsonify({"status": "ok", "model_loaded": bool(model)})


@app.route("/predict-category", methods=["POST"])
def predict_category():
    if model is None:
        return jsonify({"error": "model not available on server"}), 503

    if not request.is_json:
        return jsonify({"error": "expected JSON body with 'text' field"}), 400

    data = request.get_json()
    text = data.get("text")
    if not text or not isinstance(text, str):
        return jsonify({"error": "missing or invalid 'text' field"}), 400

    try:
        logger.info("Predict request received. text-length=%d", len(text))
        prediction = model.predict([text])[0]
        label = LABEL_MAP.get(prediction, str(prediction))
        return jsonify({"predicted_category": label})
    except Exception as e:
        logger.exception("Prediction failed: %s", e)
        return jsonify({"error": "prediction failed", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
