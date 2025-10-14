const { sendError, sendSuccess } = require("../utils/responseHelper");
const SWISS_CITIES = require("../data/swiss_cities.json");

exports.getCitySuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const postalCodePattern = /^\d{4}$/;
    if (postalCodePattern.test(q)) {
      const city = SWISS_CITIES.find((city) => city.postalCode === q);
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
    const query = q.toLowerCase();
    const suggestions = SWISS_CITIES.filter((city) =>
      city.name.toLowerCase().startsWith(query)
    );
    sendSuccess(res, suggestions, "City suggestions fetched successfully", 200);
  } catch (error) {
    next(error);
    sendError(res, error, 500, "Failed to fetch city suggestions");
  }
};
