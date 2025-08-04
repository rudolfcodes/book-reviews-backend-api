const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
};

const validateRsvpStatus = (status) => {
  const validStatuses = ["attending", "maybe", "not_attending", "pending"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid RSVP status: ${status}`);
  }
};

module.exports = {
  validateObjectId,
  validateRsvpStatus,
};
