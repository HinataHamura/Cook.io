const CATEGORY_KEYWORDS = {
  Breakfast: [
    "breakfast",
    "egg",
    "eggs",
    "omelet",
    "omelette",
    "pancake",
    "waffle",
    "oat",
    "oats",
    "cereal",
    "toast",
    "smoothie",
    "yogurt",
    "granola",
    "bacon",
    "sausage",
    "bagel",
  ],
  Lunch: [
    "lunch",
    "sandwich",
    "wrap",
    "salad",
    "soup",
    "burger",
    "taco",
    "quesadilla",
    "pasta salad",
    "bowl",
    "panini",
    "noodle",
  ],
  Dinner: [
    "dinner",
    "steak",
    "roast",
    "curry",
    "rice",
    "chicken",
    "beef",
    "fish",
    "salmon",
    "pasta",
    "lasagna",
    "stew",
    "casserole",
    "grilled",
  ],
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

const predictCategory = (text) => {
  const normalized = text.toLowerCase();
  const scores = Object.entries(CATEGORY_KEYWORDS).map(([category, words]) => {
    const score = words.reduce((total, word) => {
      return normalized.includes(word) ? total + 1 : total;
    }, 0);
    return [category, score];
  });

  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "Dinner";
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Headers": "Content-Type" } };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const text = body.text;

    if (!text || typeof text !== "string") {
      return json(400, { error: "missing or invalid 'text' field" });
    }

    return json(200, {
      predicted_category: predictCategory(text),
    });
  } catch (error) {
    return json(400, {
      error: "invalid JSON body",
      detail: error.message,
    });
  }
};
