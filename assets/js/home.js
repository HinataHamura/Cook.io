"use strict";
console.log("✅ home.js loaded");

/**
 * import
 */

import { fetchData } from "./api.js";
import { $skeletonCard, cardQueries } from "./global.js";
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



/**
 * Home Page Search
 */
const /** {NodeElement} */ $searchField = document.querySelector(
    " [data-search-field]"
  );
const /** {NodeElement} */ $searchBtn =
    document.querySelector(" [data-search-btn]");

$searchBtn.addEventListener("click", function () {
  if ($searchField.value) {
    // Use backticks ``, remove extra space
    window.location = `/recipes.html?q=${encodeURIComponent($searchField.value)}`;
  }
});

/**
 * Search submit when press "Enter" key
 */
$searchField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $searchBtn.click();
});

/**
 * Tab panel navigation
 */
const /** {NodeList} */ $tabBtns = document.querySelectorAll("[data-tab-btn]");
const /** {NodeList} */ $tabPanels =
    document.querySelectorAll("[data-tab-panel]");

let /** {NodeElement} */ [$lastActiveTabPanel] = $tabPanels;
let /** {NodeElement} */ [$lastActiveTabBtn] = $tabBtns;

addEventOnElements($tabBtns, "click", function () {
  // Deactivate previous tab
  $lastActiveTabPanel.setAttribute("hidden", "");
  $lastActiveTabBtn.setAttribute("aria-selected", false);
  $lastActiveTabBtn.setAttribute("tabindex", -1);

  // Activate current tab
  const /** {NodeElement} */ $currentTabPanel = document.querySelector(
      `#${this.getAttribute("aria-controls")}`
    );

  $currentTabPanel.removeAttribute("hidden");
  this.setAttribute("aria-selected", true);
  this.setAttribute("tabindex", 0);

  // Update last active references
  $lastActiveTabPanel = $currentTabPanel;
  $lastActiveTabBtn = this;
  addTabContent(this, $currentTabPanel);
});

//UPDATED
// === Initialize the default tab on load ===
// window.addEventListener("DOMContentLoaded", () => {
//   const $defaultTabBtn = document.querySelector('[data-tab-btn][aria-selected="true"]');
//   const $defaultTabPanel = document.querySelector(`#${$defaultTabBtn.getAttribute("aria-controls")}`);

//   if ($defaultTabBtn && $defaultTabPanel) {
//     addTabContent($defaultTabBtn, $defaultTabPanel);
//   }
// });

/**
 * Navigate Tab with arrow key
 */
addEventOnElements($tabBtns, "keydown", function (e) {
  const /** {NodeElement} */ $nextElement = this.nextElementSibling;
  const /** {NodeElement} */ $previousElement = this.previousElementSibling;

  if (e.key === "ArrowRight" && $nextElement) {
    this.setAttribute("tabindex", -1);
    $nextElement.setAttribute("tabindex", 0);
    $nextElement.focus();
  } else if (e.key === "ArrowLeft" && $previousElement) {
    this.setAttribute("tabindex", -1);
    $previousElement.setAttribute("tabindex", 0);
    $previousElement.focus();
  } else if (e.key === "Tab") {
    this.setAttribute("tabindex", -1);
    $lastActiveTabBtn.setAttribute("tabindex", 0);
  }
});

/**
 * WORK WITH API
 * fetch data for tab content
 */

const mealTypeMap = {
  Breakfast: "breakfast",
  Lunch: "chicken",
  Dinner: "main course",
  Snack: "dessert",
  Teatime: "beverage",
};

const addTabContent = ($currentTabBtn, $currentTabPanel) => {
  const $gridList = document.createElement("div");
  $gridList.classList.add("grid-list");

  $currentTabPanel.innerHTML = `<div class="grid-list"> ${$skeletonCard.repeat(
    12
  )} </div>`;

  const tabText = $currentTabBtn.textContent.trim();
  const value = mealTypeMap[tabText];

  if (!value) {
    console.error("Unknown tab:", tabText);
    return;
  }

  const queries = [
    ["mealType", value],
    ["number", "12"],
  ];

  // Optional: add specific query keywords for more variety
  if (tabText === "Breakfast") queries.push(["query", "breakfast"]);
  if (tabText === "Lunch") queries.push(["query", "chicken"]);
  if (tabText === "Dinner") queries.push(["query", "main course"]);
  if (tabText === "Snack") queries.push(["query", "dessert"]);
  if (tabText === "Teatime") queries.push(["query", "beverage"]);

  // Add random offset to mix things up
  // queries.push(["offset", Math.floor(Math.random() * 100).toString()]);

  fetchData(queries, async function (data) {
    $currentTabPanel.innerHTML = "";

    const recipes = data.results ?? [];

    for (let i = 0; i < recipes.length; i++) {
      const { id, title, image, readyInMinutes: cookingTime } = recipes[i];

      const /** {undefined || String} */ isSaved = window.localStorage.getItem(
          `cookio-recipe${id}`
        );

      const $card = document.createElement("div");
      $card.classList.add("card");
      $card.style.animationDelay = `${100 * i}ms`;

      $card.innerHTML = `
        <figure class="card-media img-holder">
          <img src="${image}" width="195" height="195" loading="lazy" alt="${title}" class="img-cover">
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
              <span class="label-medium">${getTime(cookingTime).time || "<1"} ${
        getTime(cookingTime).timeUnit
      }</span>
            </div>
            <button class="icon-btn has-state ${
              isSaved ? "saved" : "removed"
            }" aria-label ="Add to saved recipes" onclick="saveRecipe(this, '${id}')">
              <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
              <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
            </button>
          </div>
        </div>`;

      $gridList.appendChild($card);
    }

    $currentTabPanel.appendChild($gridList);

    $currentTabPanel.innerHTML += `<a href="./recipes.html?mealType=${value}" class="btn btn-secondary label-large has-state">Show more</a>`;
  });
};

/**  FETCH DATA FOR SLIDER CARD */

let /** {Array} */ cuisineType = ["Asian", "French"];

const /** {NodeList} */ $sliderSections = document.querySelectorAll(
    "[data-slider-section]"
  );

for (const [index, $sliderSection] of $sliderSections.entries()) {
  $sliderSection.innerHTML = `
        <div class="container">
        <h2 class="section-title headline-small" id="slider-label-1">
          Latest ${cuisineType[index]} Recipes
        </h2>

        <div class="slider">
          <ul class="slider-wrapper" data-slider-wrapper>
          ${`<li class="slider-item">${$skeletonCard}</li>`.repeat(10)}
          </ul>
        </div>
        </div>
            `;

  const /** {NodeElement} */ $slideWrapper = $sliderSection.querySelector(
      "[data-slider-wrapper]"
    );

  // fetchData([...cardQueries, ["cuisineType", cuisineType[index]]], function(data){
  //   $slideWrapper.innerHTML = "";

  //   data.hits.map(item => {
  //     const { recipe: {image, label: title, totalTime: cookingTime,uri}} = item;

  fetchData(
    [
      ["cuisine", cuisineType[index]],
      ["number", "10"],
    ],
    function (data) {
      $slideWrapper.innerHTML = "";

      const recipes = data.results ?? [];

      recipes.map((recipe) => {
        const { id, title, image, readyInMinutes: cookingTime } = recipe;

        const /** {undefined || String} */ isSaved =
            window.localStorage.getItem(`cookio-recipe${id}`);

        const /** {NodeElement} */ $sliderItem = document.createElement("li");
        $sliderItem.classList.add("slider-item");

        $sliderItem.innerHTML = `
      <div class="card">
              <figure class="card-media img-holder">
          <img src="${image}" width="195" height="195" loading="lazy" alt="${title}" class="img-cover">
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
              <span class="label-medium">${getTime(cookingTime).time || "<1"} ${
          getTime(cookingTime).timeUnit
        }</span>
            </div>

            <button class="icon-btn has-state ${
              isSaved ? "saved" : "removed"
            }" aria-label ="Add to saved recipes" onclick="saveRecipe(this, '${id}')">
              <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
              <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
            </button>
          </div>
        </div>
      </div>      
      `;

        $slideWrapper.appendChild($sliderItem);
      });

      $slideWrapper.innerHTML += `
        <li class="slider-item" data-slider-item>

      <a href="./recipes.html?cuisineType=${cuisineType[
        index
      ].toLowerCase()}" class="load-more-card has-state">
        <span class="label-large">Show more</span>

        <span class="material-symbols-outlined" aria-hidden="true">
          navigate_next
        </span>
      </a>

    </li>
    `;
    }
  );
}
