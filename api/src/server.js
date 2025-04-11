// require('dotenv').config();
require('./connection/mongo.connection')();
const express = require('express');
const app = express();
const cors = require('cors');
const { appPort } = require('./config');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: '4B Creation API',
      version: '1.0.0',
      description: 'API documentation for 4B Creation application',
      contact: {
        name: 'API Support'
      },
      servers: [{
        url: `http://localhost:${appPort}`,
        description: 'Development server'
      }]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/route/*.js'], // Path to the API routes with Swagger comments
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

//log request
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/api/v1/user', require('./route/user.route')());
app.use('/api/v1/admin', require('./route/admin.route')());

// Register new routes
app.use('/api/v1/analytics', require('./route/analytics.route')());
app.use('/api/v1/certificates', require('./route/certificate.route')());
app.use('/api/v1/clusters', require('./route/cluster.route')());
app.use('/api/v1/interactions', require('./route/interaction.route')());
app.use('/api/v1/quizes', require('./route/quize.route')());
app.use('/api/v1/quize-attempts', require('./route/quizeAttempt.route')());
app.use('/api/v1/webnars', require('./route/webnar.route')());

app.listen(appPort, () => {
    console.log(`Server is running on port ${appPort}`);
    console.log(`API Documentation available at http://localhost:${appPort}/api-docs`);
});

	
