// ======================================================
// WEATHER DASHBOARD - JavaScript
// ======================================================

const API_KEY = "3d8482dc12027acddca3716bfc0e2d1c";

// Select the HTML elements that JavaScript needs to control.
const cityInput = document.getElementById("cityInput");
const searchForm = document.getElementById("searchForm");
const weatherCard = document.getElementById("weatherCard");
const forecastSection = document.getElementById("forecastSection");
const forecastList = document.getElementById("forecastList");
const loading = document.getElementById("loading");
const errorMsg = document.getElementById("errorMsg");
const statusMsg = document.getElementById("statusMsg");
const favoritesList = document.getElementById("favoritesList");
const favoriteBtn = document.getElementById("favoriteBtn");
const themeBtn = document.getElementById("themeBtn");

let currentCity = "";
let debounceTimer = null;

// Convert a weather condition into an emoji for the interface.
function getWeatherEmoji(condition) {
  const weather = condition.toLowerCase();

  if (weather.includes("clear")) return "☀️";
  if (weather.includes("cloud")) return "☁️";
  if (weather.includes("rain")) return "🌧️";
  if (weather.includes("drizzle")) return "🌦️";
  if (weather.includes("thunder")) return "⛈️";
  if (weather.includes("snow")) return "❄️";
  if (
    weather.includes("mist") ||
    weather.includes("fog") ||
    weather.includes("haze")
  ) {
    return "🌫️";
  }

  return "🌤️";
}

// Fetch current weather and five-day forecast from OpenWeatherMap.
async function getWeather(city) {
  if (API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("Add your OpenWeatherMap API key in script.js first.");
  }

  const encodedCity = encodeURIComponent(city.trim());

  const currentUrl =
    `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${API_KEY}&units=metric`;

  const forecastUrl =
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${API_KEY}&units=metric`;

  // Start both requests together and wait until both are complete.
  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(currentUrl),
    fetch(forecastUrl)
  ]);

  // fetch() does not reject automatically for HTTP errors such as 404.
  if (!currentResponse.ok || !forecastResponse.ok) {
    if (currentResponse.status === 404 || forecastResponse.status === 404) {
      throw new Error("City not found. Check the spelling and try again.");
    }

    if (currentResponse.status === 401 || forecastResponse.status === 401) {
      throw new Error("API key is not valid yet. Check your OpenWeatherMap key.");
    }

    throw new Error("Unable to get weather data. Please try again.");
  }

  const currentData = await currentResponse.json();
  const forecastData = await forecastResponse.json();

  // Return only the information that our dashboard needs.
  return {
    city: currentData.name,
    country: currentData.sys.country,
    temp: Math.round(currentData.main.temp),
    feelsLike: Math.round(currentData.main.feels_like),
    description: currentData.weather[0].description,
    condition: currentData.weather[0].main,
    humidity: currentData.main.humidity,
    windSpeed: currentData.wind.speed,
    forecast: forecastData.list
  };
}

// Put current weather values into the HTML.
function displayWeather(data) {
  currentCity = data.city;

  document.getElementById("cityName").textContent =
    `${data.city}, ${data.country}`;

  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  document.getElementById("temperature").textContent = `${data.temp}°C`;
  document.getElementById("description").textContent = data.description;
  document.getElementById("feelsLike").textContent =
    `Feels like ${data.feelsLike}°C`;

  document.getElementById("humidity").textContent = `${data.humidity}%`;
  document.getElementById("windSpeed").textContent = `${data.windSpeed} m/s`;
  document.getElementById("feelsLikeDetail").textContent =
    `${data.feelsLike}°C`;

  document.getElementById("weatherEmoji").textContent =
    getWeatherEmoji(data.condition);

  weatherCard.hidden = false;
  forecastSection.hidden = false;

  displayForecast(data.forecast);
  updateFavoriteButton();
}

// Group the API's 3-hour forecast entries by date.
// Display one representative forecast for each of the next five dates.
function displayForecast(forecastData) {
  const groupedByDate = {};

  forecastData.forEach(function (item) {
    const date = item.dt_txt.split(" ")[0];

    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }

    groupedByDate[date].push(item);
  });

  const dates = Object.keys(groupedByDate).slice(0, 5);

  forecastList.innerHTML = dates.map(function (date) {
    const dayItems = groupedByDate[date];

    // Select the forecast entry closest to 12:00 midday.
    const middayItem = dayItems.reduce(function (closest, item) {
      const itemHour = Number(item.dt_txt.split(" ")[1].slice(0, 2));
      const closestHour = Number(closest.dt_txt.split(" ")[1].slice(0, 2));

      return Math.abs(itemHour - 12) < Math.abs(closestHour - 12)
        ? item
        : closest;
    });

    const dayName = new Date(`${date}T12:00:00`).toLocaleDateString(
      "en-IN",
      { weekday: "short", day: "numeric" }
    );

    const condition = middayItem.weather[0].main;
    const emoji = getWeatherEmoji(condition);
    const temperature = Math.round(middayItem.main.temp);
    const description = middayItem.weather[0].description;

    return `
      <article class="forecast-card">
        <p class="forecast-day">${dayName}</p>
        <span class="forecast-icon">${emoji}</span>
        <p class="forecast-temp">${temperature}°C</p>
        <p class="forecast-description">${description}</p>
      </article>
    `;
  }).join("");
}

// Main search function: loading state, API request, errors and cleanup.
async function searchWeather(city) {
  const searchedCity = city.trim();

  if (!searchedCity) {
    showError("Please enter a city name.");
    return;
  }

  hideError();
  loading.style.display = "flex";
  statusMsg.textContent = "";

  try {
    const weatherData = await getWeather(searchedCity);
    displayWeather(weatherData);
    statusMsg.textContent = `Weather loaded for ${weatherData.city}.`;
  } catch (error) {
    showError(error.message);
  } finally {
    loading.style.display = "none";
  }
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = "block";
}

function hideError() {
  errorMsg.textContent = "";
  errorMsg.style.display = "none";
}

// Safely read the favorites array from localStorage.
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("weatherFavorites")) || [];
  } catch (error) {
    return [];
  }
}

// Add a city once, then save the updated array in localStorage.
function addFavorite(city) {
  const favorites = getFavorites();
  const cityName = city.trim();

  const alreadyExists = favorites.some(function (favorite) {
    return favorite.toLowerCase() === cityName.toLowerCase();
  });

  if (alreadyExists) {
    statusMsg.textContent = "This city is already in your favorites.";
    return;
  }

  favorites.push(cityName);
  localStorage.setItem("weatherFavorites", JSON.stringify(favorites));

  loadFavorites();
  updateFavoriteButton();
  statusMsg.textContent = `${cityName} added to favorites.`;
}

// Remove a city and save the new array.
function removeFavorite(city) {
  const updatedFavorites = getFavorites().filter(function (favorite) {
    return favorite.toLowerCase() !== city.toLowerCase();
  });

  localStorage.setItem("weatherFavorites", JSON.stringify(updatedFavorites));
  loadFavorites();
  updateFavoriteButton();
}

// Build the favorites list from the data stored in localStorage.
function loadFavorites() {
  const favorites = getFavorites();

  if (favorites.length === 0) {
    favoritesList.innerHTML =
      '<p class="empty-favorites">No favorite cities yet. Search for a city and add it here.</p>';
    return;
  }

  favoritesList.innerHTML = favorites.map(function (city) {
    const safeCity = encodeURIComponent(city);

    return `
      <div class="favorite-item">
        <button class="favorite-city" type="button" data-city="${safeCity}">
          ${escapeHTML(city)}
        </button>
        <button class="remove-btn" type="button"
          data-remove="${safeCity}" aria-label="Remove ${escapeHTML(city)} from favorites">×</button>
      </div>
    `;
  }).join("");
}

// Escape city names before inserting them into HTML.
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, function (character) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[character];
  });
}

// Change the main favorite button based on whether this city is saved.
function updateFavoriteButton() {
  if (!currentCity) return;

  const isFavorite = getFavorites().some(function (city) {
    return city.toLowerCase() === currentCity.toLowerCase();
  });

  favoriteBtn.textContent = isFavorite ? "★ Favorited" : "☆ Add favorite";
  favoriteBtn.disabled = isFavorite;
}

// Wait 500 milliseconds after typing stops before searching.
function debounceSearch() {
  clearTimeout(debounceTimer);

  const city = cityInput.value.trim();
  if (!city) return;

  debounceTimer = setTimeout(function () {
    searchWeather(city);
  }, 500);
}

// Load the user's saved theme preference.
function loadTheme() {
  const savedTheme = localStorage.getItem("weatherTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️ Light";
  }
}

// Switch between light and dark themes and remember the selection.
function toggleTheme() {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("weatherTheme", isDark ? "dark" : "light");
  themeBtn.textContent = isDark ? "☀️ Light" : "🌙 Dark";
}

// Connect user actions to the functions.
document.addEventListener("DOMContentLoaded", function () {
  loadFavorites();
  loadTheme();

  // Form submit: prevent page reload and search the entered city.
  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearTimeout(debounceTimer);
    searchWeather(cityInput.value);
  });

  // Input event: automatic search with a 500ms debounce.
  cityInput.addEventListener("input", debounceSearch);

  favoriteBtn.addEventListener("click", function () {
    if (currentCity) {
      addFavorite(currentCity);
    }
  });

  // One listener handles clicks on favorite city and remove buttons.
  favoritesList.addEventListener("click", function (event) {
    const cityButton = event.target.closest("[data-city]");
    const removeButton = event.target.closest("[data-remove]");

    if (cityButton) {
      const city = decodeURIComponent(cityButton.dataset.city);
      cityInput.value = city;
      searchWeather(city);
    }

    if (removeButton) {
      const city = decodeURIComponent(removeButton.dataset.remove);
      removeFavorite(city);
    }
  });

  themeBtn.addEventListener("click", toggleTheme);
});
``