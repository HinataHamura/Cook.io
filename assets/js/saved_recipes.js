"use strict";

/**
 * Import
 */
import { getTime } from "./module.js";
import { renderAnalytics, extractCaloriesFromSummary } from "./analytics.js";

const $savedRecipeContainer = document.querySelector("[data-saved-recipe-container]");

$savedRecipeContainer.innerHTML = '<h2 class="headline-small section-title">All Saved Recipes</h2>';

const $gridList = document.createElement("div");
$gridList.classList.add("grid-list");

// Collect saved recipes array for analytics
const savedRecipes = [];

// Get all saved recipes from localStorage
const savedRecipesKeys = Object.keys(window.localStorage).filter(key => key.startsWith("cookio-recipe"));

if (savedRecipesKeys.length === 0) {
  $savedRecipeContainer.innerHTML += '<p class="body-large">You haven\'t saved any recipes yet!</p>';
} else {
  savedRecipesKeys.forEach((key, index) => {
    let recipeData;

    // Try parsing JSON safely
    try {
      recipeData = JSON.parse(window.localStorage.getItem(key));
    } catch (err) {
      console.warn(`Skipping invalid JSON for ${key}:`, err);
      return; // skip this entry
    }

    // Push into analytics array (use parsed object)
  //   const calorieObj = recipeData.nutrition?.nutrients
  // ?.find(n => n.name?.toLowerCase() === "calories");

  //   const calories = calorieObj
  // ? Math.round(calorieObj.amount)
  // : Number(recipeData.calories) || 0;
    const calories = extractCaloriesFromSummary(recipeData) || Number(recipeData.calories) || 0;

    savedRecipes.push({
      diet: recipeData.diets?.[0] || recipeData.diet || "Unknown",
      cuisine: recipeData.cuisines?.[0] || recipeData.cuisine || "Unknown",
      calories
    });



    // Ensure required fields exist
    const id = recipeData.id || key.replace("cookio-recipe", "");
    const title = recipeData.label || recipeData.title || "Untitled";
    const image = recipeData.image ;
    const cookingTime = recipeData.totalTime || recipeData.readyInMinutes || 0;

    // Check if saved
    const isSaved = window.localStorage.getItem(`cookio-recipe${id}`);

    const $card = document.createElement("div");
    $card.classList.add("card");
    $card.style.animationDelay = `${100 * index}ms`;

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
          <button class="icon-btn has-state ${isSaved ? "saved" : "removed"}" aria-label="Add to saved recipes" onclick="saveRecipe(this, '${id}')">
            <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
            <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
          </button>
        </div>
      </div>
    `;

    $gridList.appendChild($card);
  });

  // Render analytics based on collected savedRecipes
  try {
    renderAnalytics($savedRecipeContainer, savedRecipes);
  } catch (err) {
    console.warn('Analytics render failed:', err);
  }
}

$savedRecipeContainer.appendChild($gridList);



/** Logout Button */
import { auth } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const logoutBtn = document.getElementById("logoutBtn");

// Show logout button if user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    logoutBtn.style.display = "inline-block"; // show button
  } else {
    logoutBtn.style.display = "none"; // hide button
  }
});

// Logout functionality
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    // Redirect to login page after logout
    window.location.href = "./login.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
});
