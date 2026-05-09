"use strict";

import { fetchRecipeInfo } from "./api.js";

// Move Spoonacular access to backend proxy. Use /api/search and /api/recipe/:id


/**
 * Add event on multiple elements
 * @param {NodeList} $elements NodeList
 * @param {String} eventType Event type string
 * @param {Function} callback Callback function
 */

window.addEventOnElements = ($elements, eventType, callback) => {
  for (const $element of $elements) {
    $element.addEventListener(eventType, callback);
  }
};

/**
 * Query fields for Spoonacular API
 * These are used to structure the card content
 */
export const /** {Array} */ cardQueries = [
    ["id"], // Recipe ID
    ["title"], // Recipe title
    ["image"], // Image URL
    ["readyInMinutes"], // Time required
  ];

/**
 * Skeleton card
 */

export const /** {String} */ $skeletonCard = ` 
                <div class="card skeleton-card">
                <div class="skeleton card-banner"></div>
                <div class="card-body">
                  <div class="skeleton card-title"></div>
                  <div class="skeleton card-text"></div>
                </div>
              </div> `;

window.saveRecipe = function (element, id) {
  const /** {String} */ isSaved = window.localStorage.getItem(
      `cookio-recipe${id}`
    );

  if (!isSaved) {
    fetchRecipeInfo(id)
      .then(data => {
        window.localStorage.setItem(`cookio-recipe${id}`, JSON.stringify(data));
        element.classList.add("saved");
        element.classList.remove("removed");
        showNotification("Added to Recipe book");
      })
      .catch(err => console.error("Fetch error:", err));
  } else {
    window.localStorage.removeItem(`cookio-recipe${id}`);
    element.classList.remove("saved");
    element.classList.add("removed");
    showNotification("Removed from Recipe book");
  }
};


const /** {NodeElement} */ $snackbarContainer = document.createElement("div"); 
$snackbarContainer.classList.add("snackbar-container"); 
document.body.appendChild($snackbarContainer);

function showNotification (message) { 
const /** {NodeElement} */ $snackbar = document.createElement("div"); 
$snackbar.classList.add("snackbar"); 
$snackbar.innerHTML = `<p class="body-medium">${message}</p>`; 
$snackbarContainer.appendChild($snackbar); 
$snackbar.addEventListener("animationend", e => $snackbarContainer. removeChild($snackbar)); 
}
