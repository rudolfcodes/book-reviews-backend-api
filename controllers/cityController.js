const { sendError, sendSuccess } = require("../utils/responseHelper");
const SWISS_CITIES = require("../data/swiss_cities.json");

function normalizeSearchTerm(str) {
  return str
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss");
}

exports.getCitySuggestions = async (req, res, next) => {
  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      return res
        .status(400)
        .json({ error: "Query parameter 'search' is required" });
    }

    const cantonPattern = /^[A-Z]{2}$/;
    if (cantonPattern.test(search)) {
      const citiesInCanton = SWISS_CITIES.filter(
        (city) => city.canton === search
      );
      if (citiesInCanton.length > 0) {
        return sendSuccess(
          res,
          citiesInCanton,
          "City suggestions fetched successfully",
          200
        );
      } else {
        return sendSuccess(
          res,
          [],
          "No cities found for the given canton",
          200
        );
      }
    }

    const postalCodePattern = /^\d{4}$/;
    if (postalCodePattern.test(search)) {
      const city = SWISS_CITIES.find((city) => city.postalCode === search);
      if (city) {
        return sendSuccess(
          res,
          [city],
          "City suggestions fetched successfully",
          200
        );
      } else {
        return sendSuccess(
          res,
          [],
          "No city found for the given postal code",
          200
        );
      }
    }
    const query = search.toLowerCase();
    const uniqueCities = new Map();
    SWISS_CITIES.forEach((city) => {
      if (!uniqueCities.has(normalizeSearchTerm(city.name))) {
        uniqueCities.set(normalizeSearchTerm(city.name), city);
      }
    });
    const suggestions = Array.from(uniqueCities.values()).filter((city) =>
      normalizeSearchTerm(city.name).includes(normalizeSearchTerm(query))
    );
    sendSuccess(res, suggestions, "City suggestions fetched successfully", 200);
  } catch (error) {
    next(error);
    sendError(res, error, 500, "Failed to fetch city suggestions");
  }
};
