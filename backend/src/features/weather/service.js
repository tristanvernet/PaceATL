export async function getWeather() {
  const weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=33.749&longitude=-84.388&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph";
  const airUrl = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=33.749&longitude=-84.388&current=us_aqi";

  const weather = await (await fetch(weatherUrl)).json();
  const air = await (await fetch(airUrl)).json();

  return {
    temperature: Math.round(weather.current.temperature_2m),
    humidity: weather.current.relative_humidity_2m,
    wind: Math.round(weather.current.wind_speed_10m),
    aqi: air.current.us_aqi,
  };
}

// api URL: https://api.open-meteo.com/v1/forecast?latitude=33.749&longitude=-84.388&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph