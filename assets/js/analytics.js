import { auth } from "./firebase.js";
import { onAuthStateChanged } from 
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const dietEl = document.getElementById("dietStat");
const cuisineEl = document.getElementById("cuisineStat");
const calorieEl = document.getElementById("calorieStat");

export function extractCaloriesFromSummary(recipe) {
  // Prefer an explicit calories field when available
  if (recipe == null) return 0;
  const explicit = Number(recipe.calories);
  if (!Number.isNaN(explicit) && explicit > 0) return Math.round(explicit);
  // Try common places for a textual summary/description
  const summary = recipe.summary || recipe.description || "";
  if (typeof summary === "string" && summary.trim()) {
    // strip HTML tags and common entities, normalize whitespace
    const text = summary
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&amp;|&#160;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Try variants with explicit units first (kcal, cal, calories, Cal)
    const unitMatch = text.match(/(\d{1,4}(?:[\,\d]{0,3})?(?:\.\d+)?)\s*(?:kcal|kcal\.|calories|cal)\b/i);
    if (unitMatch) {
      const raw = unitMatch[1].replace(/,/g, "");
      const val = parseFloat(raw);
      if (!Number.isNaN(val) && val > 0) return Math.round(val);
    }

    // Fallback: look for '123 calories' or '123 per serving' patterns
    const altMatch = text.match(/(\d{1,4}(?:[\,\d]{0,3})?)\s*(?=calorie|calories|per\s*serving)/i);
    if (altMatch) {
      const raw = altMatch[1].replace(/,/g, "");
      const val = parseInt(raw, 10);
      if (!Number.isNaN(val) && val > 0) return val;
    }
  }

  // Fallback: no calories found
  return 0;
}



onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const res = await fetch(
    `http://localhost:5000/analytics/${user.uid}`
  );
  const data = await res.json();

  if (data.length === 0) return;

  // Debug preview: print a small sample and the extracted calorie values
  try {
    console.log("🔍 Analytics fetch preview (first 3):", data.slice(0, 3));
    console.log(
      "🔢 Extracted calories preview:",
      data.map(r => ({ title: r.title || r.label, extracted: extractCaloriesFromSummary(r) })).slice(0, 10)
    );
  } catch (e) {
    console.warn("Could not print analytics preview", e);
  }

  analyzeData(data);
});

function analyzeData(recipes) {
  const dietCount = {};
  const cuisineCount = {};
  let totalCalories = 0;

  recipes.forEach(r => {

    const cal = extractCaloriesFromSummary(r);

    console.log("📊 Using calorie for analytics:", {
      title: r.title || r.label,
      calories: cal,
      diet: r.diet,
      cuisine: r.cuisine
    });

    if (r.diet) dietCount[r.diet] = (dietCount[r.diet] || 0) + 1;
    if (r.cuisine) cuisineCount[r.cuisine] = (cuisineCount[r.cuisine] || 0) + 1;

    console.log("📊 Analytics using calories:", r.title || r.label, cal);

    totalCalories += cal;

  });


  const favoriteDiet = getTop(dietCount);
  const favoriteCuisine = getTop(cuisineCount);
  const avgCalories = recipes.length
    ? Math.round(totalCalories / recipes.length)
    : 0;

  dietEl.textContent = favoriteDiet;
  cuisineEl.textContent = favoriteCuisine;
  calorieEl.textContent = avgCalories + " kcal";
}

function getTop(obj) {
  return Object.keys(obj).reduce((a, b) =>
    obj[a] > obj[b] ? a : b
  );
}

export function renderAnalytics(container, data) {
  if (!data.length) return;

  const dietCount = {};
  const cuisineCount = {};
  let totalCalories = 0;

  data.forEach(r => {
    dietCount[r.diet] = (dietCount[r.diet] || 0) + 1;
    cuisineCount[r.cuisine] = (cuisineCount[r.cuisine] || 0) + 1;
    totalCalories += extractCaloriesFromSummary(r);

  });

  const top = obj =>
    Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b);

  const avgCalories = Math.round(totalCalories / data.length);

  const section = document.createElement("section");
  section.className = "analytics-card";
  section.innerHTML = `
    <h2>Your Cooking Profile</h2>
    <p>🥗 Mostly Saved: <b>${top(dietCount)}</b></p>
    <p>🍝 Favorite Cuisine: <b>${top(cuisineCount)}</b></p>
    <p>🔥 Avg Calories Preference: <b>${avgCalories} cal</b></p>
  `;

  container.prepend(section);
}
