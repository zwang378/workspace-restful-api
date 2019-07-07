const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./api/routes/workspaceProjectRoutes');
routes(app);

app.listen(port);

console.log('Workspace Project RESTful API server started on: ' + port);
