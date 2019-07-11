'use strict';

module.exports = function(app) {
  var workspaceProject = require('../controllers/workspaceProjectController');

  app.route('/workspace')
    .get(workspaceProject.listAllWorkspaces)
    .post(workspaceProject.createAWorkspace)
    .delete(workspaceProject.deleteAWorkspace);

  app.route('/workspace/:workspaceId/user')
    .post(workspaceProject.addAnExistingUserToAWorkspace)
    .get(workspaceProject.listAllCollaborators);
};