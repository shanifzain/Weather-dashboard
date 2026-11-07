# Weather Dashboard

A lightweight, responsive weather dashboard for looking up current conditions and a five-day forecast by city.
g
## Features

- Search by city name, with automatic search as you type.
- View temperature, feels-like temperature, humidity, wind speed, and a five-day outlook.
- Save favorite cities and revisit them later.
- Switch between light and dark themes.
- Keep favorites and theme preference in the browser's local storage.

## Run locally

1. Get an API key from [OpenWeatherMap](https://openweathermap.org/api).
2. In `script.js`, set the `API_KEY` constant to your key.
3. Open `index.html` in a browser. Alternatively, serve the project directory with any static web server and open its local URL.
4. Search for a city, such as Kochi, Delhi, or London.

The dashboard uses OpenWeatherMap's Current Weather and 5 Day / 3 Hour Forecast APIs, with temperatures in Celsius.

## API key security

The API key used by a browser-based app is visible to visitors. Do not publish a personal key in a public repository. For a public deployment, use a server-side proxy and restrict the key in your OpenWeatherMap account. Keep any local key changes out of version control.

## Project files

- `index.html` — dashboard structure and accessible labels.
- `style.css` — responsive layout and light/dark themes.
- `script.js` — weather requests, rendering, favorites, and theme behavior.