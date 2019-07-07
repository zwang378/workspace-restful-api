'use strict';

module.exports = function(app) {
  var workspaceProject = require('../controllers/workspaceProjectController');

  app.route('/workspace')
    .get(workspaceProject.list_all_workspaces)
    .post(workspaceProject.create_a_workspace)
    .delete(workspaceProject.delete_a_workspace);

  app.route('/workspace/:workspaceId/user')
    .post(workspaceProject.add_an_existing_user_to_a_workspace)
    .get(workspaceProject.list_all_collaborators);
};