"use strict";

import { fetchData } from "./api.js";
import { $skeletonCard } from "./global.js";
import { getTime } from "./module.js";


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

/** Accordion */

const /** {NodeList} */ $accordions =
    document.querySelectorAll("[data-accordion]");

/**
 * @param {NodeList} $element Accordion node
 */

const initAccordion = function ($element) {
  const /** {NodeElement} */ $button = $element.querySelector(
      "[data-accordion-btn]"
    );
  let isExpanded = false;

  $button.addEventListener("click", function () {
    isExpanded = isExpanded ? false : true;
    this.setAttribute("aria-expanded", isExpanded);
  });
};

for (const $accordion of $accordions) initAccordion($accordion);

/**
 * Filter bar toggle for mobile screen
 */
const /** {NodeElement} */ $filterBar =
    document.querySelector("[data-filter-bar]");
const /** {NodeList} */ $filterTogglers = document.querySelectorAll(
    "[data-filter-toggler]"
  );
const /** {NodeElement} */ $overlay = document.querySelector("[data-overlay]");

addEventOnElements($filterTogglers, "click", function () {
  $filterBar.classList.toggle("active");
  $overlay.classList.toggle("active");
  const bodyOverflow = document.body.style.overflow;
  document.body.style.overflow =
    bodyOverflow === "hidden" ? "visible" : "hidden";
});

/**
 * Filter submit and clear
 */

const /** {NodeElement} */ $filterSubmit = document.querySelector(
    "[data-filter-submit]"
  );



const /** {NodeElement} */ $filterClear = document.querySelector(
    "[data-filter-clear]"
  );
const /** {NodeElement} */ $filterSearch = $filterBar.querySelector(
    "input[type='search']"
  );

$filterSubmit.addEventListener("click", function () {
  const $filterCheckboxes = $filterBar.querySelectorAll("input:checked");
  const params = new URLSearchParams();

  if ($filterSearch.value) params.set("q", $filterSearch.value);

  if ($filterCheckboxes.length) {
    for (const $checkbox of $filterCheckboxes) {
      const key = $checkbox.parentElement.parentElement.dataset.filter;
      const value = $checkbox.value;

      if (key === "time") {
        const [min, max] = value.split("-");
        params.set("minReadyTime", min);
        params.set("maxReadyTime", max);
      } else if (key === "calories") {
        if (value.includes("-")) {
          const [min, max] = value.split("-");
          params.set("minCalories", min);
          params.set("maxCalories", max);
        } else if (value.endsWith("+")) {
          params.set("minCalories", value.replace("+", ""));
        } else {
          params.set("maxCalories", value);
        }
      } else if (key === "servings") {
        if (value.includes("-")) {
          const [min, max] = value.split("-");
          params.set("minServings", min);
          params.set("maxServings", max);
        } else if (value.endsWith("+")) {
          params.set("minServings", value.replace("+", ""));
        } else {
          params.set("maxServings", value);
        }
      } else if (key === "intolerances") {
  // collect multiple intolerances into comma-separated values
  const current = params.get("intolerances");
  params.set("intolerances", current ? `${current},${value}` : value);
} else {
  params.set(key, value);
}
    }
  }

  // Redirect with proper URL
  window.location = params.toString() ? `?${params.toString()}` : "/recipes.html";
});


$filterSearch.addEventListener("keydown", (e) => {
  if (e.key == "Enter") $filterSubmit.click();
});

$filterClear.addEventListener("click", function () {
  const /** {NodeList} */ $filterCheckboxes =
      $filterBar.querySelectorAll("input:checked");

  $filterCheckboxes?.forEach((elem) => (elem.checked = false));
  $filterSearch.value &&= "";
});

const /** {String} */ queryStr = window.location.search.slice(1);
const /** {Array} */ queries =
    queryStr && queryStr.split("&").map((i) => i.split("="));

const /** {NodeElement} */ $filterCount = document.querySelector(
    "[data-filter-count]"
  );

if (queries.length) {
  $filterCount.style.display = "block";
  $filterCount.innerHTML = queries.length;
} else {
  $filterCount.style.display = "none";
}


if (queryStr) {
  const params = new URLSearchParams(window.location.search);

  // Restore search input
  const q = params.get("q") || params.get("query");
  if (q) $filterSearch.value = decodeURIComponent(q);

  // Restore time, calories, ingredients filters
  ["time", "calories", "servings"].forEach((filter) => {
    const $group = $filterBar.querySelector(`[data-filter="${filter}"]`);
    if (!$group) return;

    $group.querySelectorAll("input").forEach(($input) => {
      const val = $input.value;

      if (filter === "time") {
        const min = params.get("minReadyTime");
        const max = params.get("maxReadyTime");
        if (min && max && val === `${min}-${max}`) $input.checked = true;
      } else if (filter === "calories") {
        const min = params.get("minCalories");
        const max = params.get("maxCalories");
        if (min && max && val === `${min}-${max}`) $input.checked = true;
        else if (min && val === `${min}+`) $input.checked = true;
        else if (max && val === max) $input.checked = true;
      } else if (filter === "servings") {
      const min = params.get("minServings");
      const max = params.get("maxServings");
      if (min && max && val === `${min}-${max}`) $input.checked = true;
      else if (min && !max && val === `${min}+`) $input.checked = true; // single min+
      else if (!min && max && val === max) $input.checked = true; // exact max
    }
    });
  });

  // Restore mealType, diet, cuisineType, dishType filters
  ["mealType", "diet", "cuisineType", "dishType", "intolerances"].forEach((key) => {
  const $group = $filterBar.querySelector(`[data-filter="${key}"]`);
  if (!$group) return;

  params.getAll(key).forEach((val) => {
    const $input = $group.querySelector(`[value="${val}"]`);
    if ($input) $input.checked = true;
  });

  // For intolerances we need to split comma list
  if (key === "intolerances") {
    const vals = (params.get("intolerances") || "").split(",");
    vals.forEach((val) => {
      const $input = $group.querySelector(`[value="${val}"]`);
      if ($input) $input.checked = true;
    });
  }
});

}


const /** {NodeElement} */ $filterBtn =
    document.querySelector("[data-filter-btn]");

window.addEventListener("scroll", (e) => {
  $filterBtn.classList[window.scrollY >= 120 ? "add" : "remove"]("active");
});

const $gridList = document.querySelector("[data-grid-list]");
const $loadMore = document.querySelector("[data-load-more]");
const pageSize = 20;

let offset = 0;
let nextPageUrl = "";
let requestedBefore = false;

$gridList.innerHTML = $skeletonCard.repeat(pageSize);

// Helper for time
function formatTime(mins) {
  return typeof mins === "number" && mins > 0 ? `${mins} min` : "<1 min";
}

// Render recipes
function renderRecipes(recipes) {
  if (!recipes.length) {
    $gridList.innerHTML =
      '<p class="body-medium info-text">No recipe found</p>';
    return;
  }

  recipes.forEach((recipe) => {
    const { id, title, image, readyInMinutes } = recipe;
    const isSaved = window.localStorage.getItem(`cookio-recipe${id}`);
    const $card = document.createElement("div");
    $card.classList.add("card");

    $card.innerHTML = `
      <figure class="card-media img-holder">
        <img src="${image}" width="195" height="195" loading="lazy" alt="${
      title || "Recipe image"
    }" class="img-cover">
      </figure>

      <div class="card-body">
        <h3 class="title-small">
          <a href="./detail.html?recipe=${id}" class="card-link">${
      title ?? "Untitled"
    }</a>
        </h3>

        <div class="meta-wrapper">
          <div class="meta-item">
            <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
            <span class="label-medium">${formatTime(readyInMinutes)}</span>
          </div>

          <button class="icon-btn has-state ${isSaved ? "saved" : "removed"}"
                  aria-label="Add to saved recipes"
                  onclick="saveRecipe(this, '${id}')">
            <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
            <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
          </button>
        </div>
      </div>
    `;

    $gridList.appendChild($card);
  });
}




// Load a page
function loadPage(append = false) {
  const params = new URLSearchParams(window.location.search);
  const queries = [
    ["number", pageSize],
    ["addRecipeInformation", "true"],
    ["sort", "popularity"],
    ["offset", offset],
  ];

  const minReadyTime = params.get("minReadyTime");
  const maxReadyTime = params.get("maxReadyTime");
  if (minReadyTime) queries.push(["minReadyTime", minReadyTime]);
  if (maxReadyTime) queries.push(["maxReadyTime", maxReadyTime]);

  const minCalories = params.get("minCalories");
  const maxCalories = params.get("maxCalories");
  if (minCalories) queries.push(["minCalories", minCalories]);
  if (maxCalories) queries.push(["maxCalories", maxCalories]);

  const minServings = params.get("minServings");
  const maxServings = params.get("maxServings");
  if (minServings) queries.push(["minServings", minServings]);
  if (maxServings) queries.push(["maxServings", maxServings]);

  
  // Add type/diet/cuisine/dishType filters
["diet", "cuisineType", "dishType", "mealType"].forEach((key) => {
  params.getAll(key).forEach((val) => {
    // spoonacular API তে "mealType" actually "type" নামে লাগে
    if (key === "mealType") queries.push(["type", val]);
    else if (key === "cuisineType") queries.push(["cuisine", val]);
    else if (key==="dishType") queries.push(["type",val]);
    else queries.push([key, val]);
  });
});

// handle intolerances separately (comma-separated)
const intolerances = params.get("intolerances");
if (intolerances) queries.push(["intolerances", intolerances]);

  const queryParam = params.get("q") || params.get("query");
  if (queryParam) queries.push(["query", queryParam]);

 console.log(
    "✅Initial API (proxied):",
    `/api/search?${new URLSearchParams(queries).toString()}`
  );


   fetchData(queries, (data) => {
    const recipes = Array.isArray(data?.results) ? data.results : [];
    if (!append) $gridList.innerHTML = "";


    renderRecipes(recipes);

    const respOffset = Number(data?.offset ?? offset);
    const number = Number(data?.number ?? recipes.length);
    const total = Number(data?.totalResults ?? recipes.length);
    offset = respOffset + number;

    if (offset < total) {
      // Create nextPageUrl with SAME filters
      const nextQueries = [...queries]; // copy same filters
      const newParams = new URLSearchParams(nextQueries);
      newParams.set("offset", offset); // update offset

      nextPageUrl = `/api/search?${newParams.toString()}`;

      console.log("✅Next Page API (proxied):", nextPageUrl);

      if ($loadMore) {
        $loadMore.style.display = "";
        $loadMore.disabled = false;
        $loadMore.textContent = "Load more";
      }
    } else {
      nextPageUrl = "";
      if ($loadMore) $loadMore.style.display = "none";
    }
  });
  
}

// Load more button
if ($loadMore) {
  $loadMore.addEventListener("click", () => {
    $loadMore.disabled = true;
    $loadMore.textContent = "Loading…";
    loadPage(true);
  });
}

// Infinite scroll
window.addEventListener("scroll", async () => {
  if (
    $loadMore.getBoundingClientRect().top < window.innerHeight &&
    !requestedBefore &&
    nextPageUrl
  ) {
    $loadMore.innerHTML = $skeletonCard.repeat(6);
    requestedBefore = true;

    try {
      const resp = await fetch(nextPageUrl);
      const data = await resp.json();
      const recipes = Array.isArray(data?.results) ? data.results : [];
      renderRecipes(recipes);

      const respOffset = Number(data?.offset ?? offset);
      const number = Number(data?.number ?? recipes.length);
      const total = Number(data?.totalResults ?? recipes.length);
      offset = respOffset + number;

      // update nextPageUrl
      if (offset < total) {
        const query = new URLSearchParams([
          ["addRecipeInformation", "true"],
          ["sort", "popularity"],
          ["number", pageSize],
          ["offset", offset],
        ]);
        const params = new URLSearchParams(window.location.search);


        ["diet", "cuisineType", "dishType", "mealType"].forEach((key) => {
  params.getAll(key).forEach((val) => {
    // spoonacular API তে "mealType" actually "type" নামে লাগে
    if (key === "mealType") queries.push(["type", val]);
    else if (key === "dishType") queries.push(["type", val]);
    else if (key === "cuisineType") queries.push(["cuisine", val]);
    else queries.push([key, val]);
  });
});
 
        const minIngredients = params.get("minIngredients");
        const maxIngredients = params.get("maxIngredients");
        if (minIngredients) query.append("minIngredients", minIngredients);
        if (maxIngredients) query.append("maxIngredients", maxIngredients);

        // Add time & calories filters
        const minReadyTime = params.get("minReadyTime");
        const maxReadyTime = params.get("maxReadyTime");
        if (minReadyTime) query.append("minReadyTime", minReadyTime);
        if (maxReadyTime) query.append("maxReadyTime", maxReadyTime);

        const minCalories = params.get("minCalories");
        const maxCalories = params.get("maxCalories");
        if (minCalories) query.append("minCalories", minCalories);
        if (maxCalories) query.append("maxCalories", maxCalories);

        const intolerances = params.get("intolerances");
if (intolerances) query.append("intolerances", intolerances);


        // Add search query
        const q = params.get("q") || params.get("query");
        if (q) query.append("query", q);


        nextPageUrl = `/api/search?${query.toString()}`;
      } else nextPageUrl = "";

      $loadMore.innerHTML = "";
      requestedBefore = false;
    } catch (err) {
      console.error("❌ Error fetching more recipes:", err);
      $loadMore.innerHTML =
        '<p class="body-medium info-text">Failed to load more recipes</p>';
      requestedBefore = false;
    }
  }
});

// Initial load
loadPage(false);
