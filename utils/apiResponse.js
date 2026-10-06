function apiResponse(statusCode, data) {
  return {
    statusCode,
    data,
  };
}

module.exports = { apiResponse };
