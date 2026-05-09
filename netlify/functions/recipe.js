const SPOONACULAR_RECIPE_URL = "https://api.spoonacular.com/recipes";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

const getRecipeId = (event) => {
  if (event.queryStringParameters?.id) return event.queryStringParameters.id;

  const match = event.path.match(/\/recipe\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.SPOONACULAR_KEY || process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Missing SPOONACULAR_KEY on server" });
  }

  const recipeId = getRecipeId(event);
  if (!recipeId || !/^\d+$/.test(recipeId)) {
    return json(400, { error: "Missing or invalid recipe id" });
  }

  const params = new URLSearchParams(event.queryStringParameters || {});
  params.delete("id");
  params.delete("apiKey");

  if (!params.has("includeNutrition")) params.set("includeNutrition", "true");
  params.set("apiKey", apiKey);

  try {
    const response = await fetch(
      `${SPOONACULAR_RECIPE_URL}/${encodeURIComponent(recipeId)}/information?${params.toString()}`,
      { headers: { Accept: "application/json" } },
    );
    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
      body,
    };
  } catch (error) {
    return json(502, {
      error: "Spoonacular request failed",
      detail: error.message,
    });
  }
};
