export const errorHandler = (error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'internal_server_error' });
};
