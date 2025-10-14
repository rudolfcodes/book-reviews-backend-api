const { sendError, sendSuccess } = require("../utils/responseHelper");
const SWISS_CITIES = require("../data/swiss_cities.json");

exports.getCitySuggestions = async (req, res, next) => {
  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      return res
        .status(400)
        .json({ error: "Query parameter 'search' is required" });
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
      if (!uniqueCities.has(city.name.toLowerCase())) {
        uniqueCities.set(city.name.toLowerCase(), city);
      }
    });
    const suggestions = Array.from(uniqueCities.values()).filter((city) =>
      city.name.toLowerCase().startsWith(query)
    );
    sendSuccess(res, suggestions, "City suggestions fetched successfully", 200);
  } catch (error) {
    next(error);
    sendError(res, error, 500, "Failed to fetch city suggestions");
  }
};
