"use strict";

// Keep Spoonacular hidden behind the backend proxy.
// In production, Netlify should rewrite /api/* to the Flask backend.
const API_BASE = window.COOKIO_API_BASE || "";
const apiUrl = (path) => `${API_BASE}${path}`;

window.ACCESS_POINT = apiUrl("/api/search");

/**
 * Fetch data from Spoonacular API
 * @param {Array} queries Array of [key, value] pairs
 * @param {Function} successCallback Success callback function
 */
export const fetchData = async function (queries, successCallback) {
  const defaultParams = [
    ["addRecipeInformation", "true"]
  ];

  const fullQueries = [...defaultParams, ...(queries || [])];

  // Build query string
  const queryString = fullQueries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  const url = `${window.ACCESS_POINT}${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("API response not OK");

    const data = await response.json();
    successCallback(data);
  } catch (error) {
    console.error("Fetch error:", error.message);
  }
};

/**
 * Fetch full recipe information (includes nutrition) for a single recipe id
 * Returns parsed JSON or throws on network error
 */
export const fetchRecipeInfo = async function(id) {
  if (!id) throw new Error('missing id');
  const url = apiUrl(`/api/recipe/${encodeURIComponent(id)}?includeNutrition=true`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`recipe info fetch failed: ${resp.status}`);
  return await resp.json();
};

/**
 * Search a recipe by title and return the first matching recipe object
 * (includes nutrition when available)
 */
export const searchRecipeByTitle = async function(title) {
  if (!title) return null;
  const url = apiUrl(`/api/search?query=${encodeURIComponent(title)}&addRecipeInformation=true&number=1`);
  const resp = await fetch(url);
  if (!resp.ok) {
    console.warn('searchRecipeByTitle failed', resp.status);
    return null;
  }
  const data = await resp.json();
  if (data && Array.isArray(data.results) && data.results.length > 0) return data.results[0];
  return null;
};
