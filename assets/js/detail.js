"use strict";

// Spoonacular API key moved to backend Flask proxy. Frontend calls /api/recipe/:id

import { getTime } from "./module.js";
import { $skeletonCard } from "./global.js";
import { toggleRecipe } from "./saved.js";
import { fetchRecipeInfo } from "./api.js";



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



const $detailContainer = document.querySelector("[data-detail-container]");


const recipeId = new URLSearchParams(window.location.search).get("recipe");

if (!recipeId) {
  console.error("❌ No recipe ID found in URL");
} else {
  fetchRecipeInfo(recipeId)
    .then(data => {
      console.log("✅ Recipe data:", data);

      const {
        title = "Untitled",
        image,
        sourceName: author = "Unknown",
        readyInMinutes = 0,
        nutrition,
        cuisines = [],
        diets = [],
        dishTypes = [],
        extendedIngredients = [],
        servings = 0
      } = data;

      document.title = `${title} - Cook.io`;

      const bannerUrl = image || "assets/images/detail-banner.jpg";

      let calories = 0;
      if (nutrition?.nutrients) {
        const calObj = nutrition.nutrients.find(n => n.name === "Calories");
        if (calObj) calories = Math.round(calObj.amount);
      }

      // Map dishTypes to Spoonacular's accepted "type" values
      const TYPE_MAP = {
        "morning meal": "breakfast",
        "brunch": "breakfast",
        "drink": "drink",
        "beverage": "beverage",
        "main dish": "main course",
        "hor d'oeuvre": "appetizer",
        "antipasto": "appetizer",
        "starter": "appetizer",
        "fingerfood": "snack"
      };

      // Tags (cuisine, diet, dishType)
      const tags = [...cuisines, ...diets, ...dishTypes];
      let tagElements = "";

      tags.forEach(tag => {
        let category = "";
        let param = tag.toLowerCase();

        if (cuisines.includes(tag)) {
          category = "cuisineType";
        } else if (diets.includes(tag)) {
          category = "diet";
        } else if (dishTypes.includes(tag)) {
          category = "dishType";
          if (TYPE_MAP[param]) {
            param = TYPE_MAP[param]; // normalize invalid values
          }
        } else {
          category = "type"; // fallback
        }

        tagElements += `<a href="./recipes.html?${category}=${encodeURIComponent(param)}" 
          class="filter-chip label-large has-state" 
          data-tag-type="${category}" 
          data-tag-value="${param}">${tag}</a>`;
      });

      // Ingredients
      const ingredientItems = extendedIngredients
        .map(ingr => `<li class="ingr-item">${ingr.original}</li>`)
        .join("");

      const cookingTime = readyInMinutes > 0 ? readyInMinutes : "<1";

      $detailContainer.innerHTML = `
        <figure class="detail-banner img-holder">
          <img src="${bannerUrl}" alt="${title}" class="img-cover">
        </figure>

        <div class="detail-content">
          <div class="title-wrapper">
            <h1 class="display-small">${title}</h1>
            <div class="detail-actions">
              <button 
                class="btn btn-secondary has-state has-icon ${localStorage.getItem(`cookio-recipe${recipeId}`) ? "saved" : "removed"}" 
                data-save-recipe 
                data-recipe-id="${recipeId}" 
                data-calories="${calories}">
                <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
                <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
                <span class="label-large save-text">Save</span>
                <span class="label-large unsaved-text">Unsave</span>
              </button>

              <button class="btn btn-primary has-icon predict-btn" data-predict-title="${encodeURIComponent(title)}">
                <span class="material-symbols-outlined" aria-hidden="true">science</span>
                <span class="label-large">Predict</span>
              </button>
            </div>
          </div>

          <div class="detail-author label-large">
            <span class="span">by</span> ${author}
          </div>

          <div class="detail-stats">
            <div class="stats-item">
              <span class="display-medium">${extendedIngredients.length}</span>
              <span class="label-medium">Ingredients</span>
            </div>

            <div class="stats-item">
              <span class="display-medium">${cookingTime}</span>
              <span class="label-medium">Minutes</span>
            </div>

            <div class="stats-item">
              <span class="display-medium">${calories}</span>
              <span class="label-medium">Calories</span>
            </div>
          </div>

          ${tagElements ? `<div class="tag-list">${tagElements}</div>` : ""}

          <h2 class="title-medium ingr-title">
            Ingredients
            <span class="label-medium">for ${servings} Servings</span>
          </h2>
          ${ingredientItems ? `<ul class="body-large ingr-list">${ingredientItems}</ul>` : ""}
        </div>
      `;

      // Attach click listener for save button
      $detailContainer.querySelectorAll("[data-save-recipe]").forEach(btn => {
        const id = btn.dataset.recipeId;
        btn.addEventListener("click", () => {
          window.saveRecipe(btn, id);
        });
      });

      // Attach click listener for predict button(s)
      $detailContainer.querySelectorAll("[data-predict-title]").forEach(btn => {
        btn.addEventListener("click", () => {
          const encoded = btn.dataset.predictTitle || '';
          const text = encoded ? decodeURIComponent(encoded) : '';
          // Navigate to predict page with query param
          const url = new URL(window.location.origin + '/predict.html');
          if (text) url.searchParams.set('text', text);
          window.location = url.toString();
        });
      });

      // Attach click listeners for dynamic tags (build valid query for recipes.html)
      $detailContainer.querySelectorAll("[data-tag-type]").forEach(tag => {
        tag.addEventListener("click", e => {
          e.preventDefault();
          const type = tag.dataset.tagType;
          const value = tag.dataset.tagValue;

          const urlParams = new URLSearchParams();
          urlParams.set(type, value);

          window.location = `recipes.html?${urlParams.toString()}`;
        });
      });

    })
    .catch(err => console.error("❌ Fetch error:", err.message));
}
