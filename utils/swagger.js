// swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger options
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DEC SUPEER APP API",
      version: "1.0.0",
      description:
        "API documentation for the DEC SUPEER APP API w/c is a RESTful API For University Managment",
    },
    servers: [
      {
        url: "https://eduapi.senaycreatives.com", // Your server URL
      },
    ],
    components: {
      securitySchemes: {
        tokenAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "JWT token for authentication (without 'Bearer')",
        },
      },
    },
  },
  apis: ["./Routes/*.js"], // Path to the API routes or JS files containing JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  // Serve Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
