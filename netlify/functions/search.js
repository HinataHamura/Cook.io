const SPOONACULAR_SEARCH_URL = "https://api.spoonacular.com/recipes/complexSearch";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.SPOONACULAR_KEY || process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Missing SPOONACULAR_KEY on server" });
  }

  const params = new URLSearchParams(event.queryStringParameters || {});
  params.delete("apiKey");

  if (!params.has("addRecipeInformation")) params.set("addRecipeInformation", "true");
  if (!params.has("number")) params.set("number", "20");
  params.set("apiKey", apiKey);

  try {
    const response = await fetch(`${SPOONACULAR_SEARCH_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
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
