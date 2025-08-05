const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
  };
};

const successResponse = (data) => createResponse(200, { success: true, data });

const errorResponse = (error, statusCode = 500) => {
  console.error('API Error:', error);
  
  return createResponse(statusCode, {
    success: false,
    error: error.message || 'Internal server error'
  });
};

const validationError = (message) => errorResponse(new Error(message), 400);

const unauthorizedError = () => errorResponse(new Error('Unauthorized'), 401);

const notFoundError = (resource) => errorResponse(new Error(`${resource} not found`), 404);

export {
  createResponse,
  successResponse,
  errorResponse,
  validationError,
  unauthorizedError,
  notFoundError
};