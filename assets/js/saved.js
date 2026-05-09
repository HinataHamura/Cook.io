"use strict";

/**
 * saved.js
 * Central save/remove toggle logic
 */

import { auth, db } from "./firebase.js";
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getTime } from "./module.js";


function extractCalories(recipeData) {
  // Robust calorie extraction supporting several API shapes
  if (!recipeData) return 0;

  const parseNumber = v => {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const m = v.replace(/,/g, "").match(/([-+]?[0-9]*\.?[0-9]+)/);
      if (m) return parseFloat(m[0]);
    }
    return null;
  
  };

  // 1) Spoonacular: recipeData.nutrition.nutrients[] with name 'Calories' or similar
  const nutrients = recipeData.nutrition?.nutrients;
  if (Array.isArray(nutrients)) {
    const calItem = nutrients.find(n => (n?.name || n?.title || "").toString().toLowerCase().includes("calorie"));
    if (calItem) {
      const v = parseNumber(calItem.amount ?? calItem.value ?? calItem.quantity);
      if (v !== null) return Math.round(v);
    }
  }

  // 2) Edamam: top-level calories number
  const topCal = parseNumber(recipeData.calories ?? recipeData.energy ?? recipeData.calorie);
  if (topCal !== null) return Math.round(topCal);

  // 3) Edamam totalNutrients: ENERC_KCAL
  const enerc = recipeData.totalNutrients?.ENERC_KCAL ?? recipeData.totalNutrients?.energy;
  if (enerc) {
    const v = parseNumber(enerc.quantity ?? enerc.amount ?? enerc);
    if (v !== null) return Math.round(v);
  }

  // 4) Sometimes nutrition.calories is an object or string
  const nutCal = recipeData.nutrition?.calories ?? recipeData.nutrition?.calories?.value ?? recipeData.nutrition?.calories?.amount;
  const nutParsed = parseNumber(nutCal);
  if (nutParsed !== null) return Math.round(nutParsed);

  // 5) Try to derive from ingredient-level info (sum estimated calories if present)
  if (Array.isArray(recipeData.extendedIngredients)) {
    let sum = 0;
    let found = false;
    for (const ing of recipeData.extendedIngredients) {
      const ingCal = parseNumber(ing.calories ?? ing.nutrition?.calories ?? ing.nutrition?.energy);
      if (ingCal !== null) {
        sum += ingCal;
        found = true;
      }
    }
    if (found) return Math.round(sum);
  }

  // 6) Spoonacular summary HTML parsing (MOST IMPORTANT FIX)
if (typeof recipeData.summary === "string") {
  const match = recipeData.summary.match(/(\d+)\s*calories/i);
  if (match) {
    return parseInt(match[1], 10);
  }
}


  // fallback heuristic (optional): estimate from cooking time when nothing else
  if (recipeData.readyInMinutes) {
    return Math.round(recipeData.readyInMinutes * 15);
  }

  return 0;
}

function extractCaloriesFromSummary(recipe) {
  if (!recipe?.summary) return 0;

  const match = recipe.summary.match(/(\d+)\s*calories/i);
  return match ? parseInt(match[1], 10) : 0;
}


// DOM container for saved recipes page
const $savedRecipeContainer = document.querySelector("[data-saved-recipe-container]");

/**
 * Check if recipe is saved (Firestore or localStorage)
 */
export async function isRecipeSaved(id) {
  const user = auth.currentUser;
  if (user) {
    const docRef = doc(db, "users", user.uid, "savedRecipes", id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists();
  } else {
    return !!localStorage.getItem(`cookio-recipe${id}`);
  }
}

/**
 * Toggle recipe save/remove
 */
export async function toggleRecipe(btn, recipeData) {
  const user = auth.currentUser;
  const id = recipeData.id;
  const isSaved = btn.classList.contains("saved");

  if (user) {
    const docRef = doc(db, "users", user.uid, "savedRecipes", id);
    try {
      if (isSaved) {
        await deleteDoc(docRef);
        btn.classList.replace("saved", "removed");
      } else {
        

        recipeData.id = recipeData.id || crypto.randomUUID();

        const calories =
          recipeData.calories && recipeData.calories > 0
            ? recipeData.calories
            : extractCaloriesFromSummary(recipeData);

        const normalizedRecipe = {
          id: recipeData.id,
          title: recipeData.title,
          image: recipeData.image,
          cuisines: recipeData.cuisines || [],
          diets: recipeData.diets || [],
          calories,               // ✅ ALWAYS SAVED
          savedAt: Date.now()
        };


        await setDoc(docRef, normalizedRecipe);

        btn.classList.replace("removed", "saved");
      }
    } catch (err) {
      console.error("Firestore save/remove error:", err);
    }
  } else {
    // fallback: localStorage
    if (isSaved) {
      localStorage.removeItem(`cookio-recipe${id}`);
      btn.classList.replace("saved", "removed");
    } else {
      const calories =
        recipeData.calories && recipeData.calories > 0
          ? recipeData.calories
          : extractCaloriesFromSummary(recipeData);

      console.log("💾 Saving recipe with calories:", recipeData.title, calories);

      const normalizedRecipe = {
        id: recipeData.id,
        title: recipeData.title,
        image: recipeData.image,
        cuisines: recipeData.cuisines || [],
        diets: recipeData.diets || [],
        calories,               // ✅ MUST EXIST
        savedAt: Date.now()
      };



      console.debug("Saving recipe to localStorage:", `cookio-recipe${id}`, normalizedRecipe);

      localStorage.setItem(`cookio-recipe${id}`, JSON.stringify(normalizedRecipe));

      btn.classList.replace("removed", "saved");
    }
  }
}

/**
 * Render a single recipe card
 */
export async function renderRecipeCard(recipeData, index, container) {
  const id = recipeData.id || `local-${index}`;
  const title = recipeData.label || recipeData.title || "Untitled";
  const image = recipeData.image;
  const cookingTime = recipeData.totalTime || recipeData.readyInMinutes || 0;
  const calories = extractCalories(recipeData);

  const $card = document.createElement("div");
  $card.classList.add("card");
  $card.style.animationDelay = `${100 * index}ms`;

  // Check saved state
  const isSaved = await isRecipeSaved(id);

  $card.innerHTML = `
    <figure class="card-media img-holder">
      <img src="${image}" width="195" height="195" loading="lazy" alt="${title}" class="img-cover">
    </figure>
    <div class="card-body">
      <h3 class="title-small">
        <a href="./detail.html?recipe=${id}" class="card-link">${title}</a>
      </h3>
      <div class="meta-wrapper">
        <div class="meta-item">
          <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
          <span class="label-medium">${getTime(cookingTime).time || "<1"} ${getTime(cookingTime).timeUnit}</span>
        </div>
        <div class="meta-item">
          <span class="material-symbols-outlined" aria-hidden="true">whatshot</span>
          <span class="label-medium">${calories} kcal</span>
        </div>
        <button class="icon-btn has-state ${isSaved ? "saved" : "removed"}" aria-label="Add to saved recipes" onclick='toggleRecipe(this, ${JSON.stringify(recipeData).replaceAll("'", "&apos;")})'>
          <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
          <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
        </button>
      </div>
    </div>
  `;

  container.appendChild($card);
}

/**
 * Load saved recipes page
 */
export async function loadSavedRecipes() {
  if (!$savedRecipeContainer) return;

  $savedRecipeContainer.innerHTML = '<h2 class="headline-small section-title">All Saved Recipes</h2>';
  const $gridList = document.createElement("div");
  $gridList.classList.add("grid-list");

  const user = auth.currentUser;

  if (user) {
    // Firestore saved recipes
    try {
      const colRef = collection(db, "users", user.uid, "savedRecipes");
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        $savedRecipeContainer.innerHTML += '<p class="body-large">You haven\'t saved any recipes yet!</p>';
      } else {
        let index = 0;
        for (const docSnap of snapshot.docs) {
          await renderRecipeCard(docSnap.data(), index++, $gridList);
        }
      }
    } catch (err) {
      console.error("Error fetching Firestore saved recipes:", err);
      $savedRecipeContainer.innerHTML += '<p class="body-large">Error loading saved recipes.</p>';
    }
  } else {
    // localStorage fallback
    const savedKeys = Object.keys(localStorage).filter(key => key.startsWith("cookio-recipe"));
    if (savedKeys.length === 0) {
      $savedRecipeContainer.innerHTML += '<p class="body-large">You haven\'t saved any recipes yet!</p>';
    } else {
      let index = 0;
      for (const key of savedKeys) {
        let recipeData;
        try {
          recipeData = JSON.parse(localStorage.getItem(key));
        } catch (err) {
          console.warn(`Skipping invalid JSON for ${key}`, err);
          continue;
        }
        await renderRecipeCard(recipeData, index++, $gridList);
      }
    }
  }

  $savedRecipeContainer.appendChild($gridList);
}

/**
 * Sync localStorage recipes to Firestore on login
 */
export async function syncLocalToFirestore() {
  const user = auth.currentUser;
  if (!user) return;

  const savedKeys = Object.keys(localStorage).filter(key => key.startsWith("cookio-recipe"));

  for (const key of savedKeys) {
    let recipeData;
    try {
      recipeData = JSON.parse(localStorage.getItem(key));
    } catch (err) {
      continue;
    }

    const docRef = doc(db, "users", user.uid, "savedRecipes", recipeData.id);
    await setDoc(docRef, recipeData);
    localStorage.removeItem(key);
  }
}


