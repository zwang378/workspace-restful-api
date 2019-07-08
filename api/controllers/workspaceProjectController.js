'use strict';

const fs = require('fs');
const csv = require('csv-parser');

// This workspaceId is for creating a workspace,
// and it is a variable to remember the last row id to avoid
// looking for the last row id next time when the app is still running.
var workspaceId;

exports.list_all_workspaces = function(req, res) {
  var workspaces = [];
  
  fs.createReadStream('./data/workspace.csv')
    .on('error', (err) => {
      console.log(err);
      res.statusCode = 500;
      res.json({ 
        message: ['Could not find your workspace!']
      });
    })
    .pipe(csv())
    .on('data', (row) => {
      workspaces.push(row);
    })
    .on('end', () => {
      res.statusCode = 200;
      res.json({ 
        message: ['Workspace listed!'],
        workspace: workspaces
      });
    });
};

exports.create_a_workspace = function(req, res) {
  var path = './data/workspace.csv';

  // This does not check if there is a valid csv file.
  fs.access(path, fs.F_OK, (err) => {
    // If the workspace file doesn't exist, create one.
    if (err) {      
      var workspace_header = 'id,name,org_id\n';

      fs.writeFile(path, workspace_header, function (err) {
        if (err) {
          console.log(err);
          res.statusCode = 500;
          res.json({ error: ['Could not write the workspace!'] });
        }
      });
    }
  
    // If workspaceId is undefined, it means no one calls this function.
    // Then it finds the last row id to decide the new id.
    if (workspaceId == undefined) {
      var lastRow;

      fs.createReadStream('./data/workspace.csv')
        .pipe(csv())
        .on('data', (row) => {
          lastRow = row;
        })
        .on('end', () => {
          if (lastRow === undefined) {
            workspaceId = 1;
          } else {
            workspaceId = parseInt(lastRow.id, 10) + 1;
          }

          var rowData = workspaceId + ',' + req.body.name + ',' + req.body.org_id + '\n';

          if (req.body.name === undefined || req.body.org_id === undefined) {
            console.log('Not enough info!');
            res.statusCode = 400;
            res.json({ error: ['Miss necessary info!'] });
            return;
          }

          fs.appendFile('./data/workspace.csv', rowData, function(err) {
            if (err) {
              console.log(err);
              res.statusCode = 500;
              res.json({ error: ['Could not create the workspace!'] });
            }
          });

          res.statusCode = 200;
          res.json({ success: ['Workspace created!'] });
        });
    } else {
      workspaceId += 1;

      var rowData = workspaceId + ',' + req.body.name + ',' + req.body.org_id + '\n';

      fs.appendFile('./data/workspace.csv', rowData, function(err) {
        if (err) {
          console.log(err);
          res.statusCode = 500;
          res.json({ error: ['Could not create the workspace!'] });
        }
      });

      res.statusCode = 200;
      res.json({ success: ['Workspace created!'] });
    }
  });
};

// This function does not check if it is an existing user id
// since it is for an existing user id.
//
// This function does not check whether the workspaceId is valid or not,
// and we can implement it by iterating the workspace file.
exports.add_an_existing_user_to_a_workspace = function(req, res) {
  var rowData = req.body.userId + ',' + req.params.workspaceId + '\n';
  var path = './data/workspace_collaborator.csv';

  fs.access(path, fs.F_OK, (err) => {
    // If the workspace_collaborator file doesn't exist, create one.
    if (err) {      
      var workspace_collaborator_header = 'user_id,workspace_id\n';

      fs.writeFile(path, workspace_collaborator_header, function (err) {
        if (err) {
          console.log(err);
          res.statusCode = 500;
          res.json({ error: ['Could not create workspace_collaborator file!'] });
        }
      });
    }

    fs.appendFile('./data/workspace_collaborator.csv', rowData, function(err) {
      if (err) {
        console.log(err);
        res.statusCode = 500;
        res.json({ error: ['Could not add the existing user!'] });
      }
    });
  });

  res.statusCode = 200;
  res.json({ success: ['Existing user added!'] });
};

exports.list_all_collaborators = function(req, res) {
  var collaborators = [];

  fs.createReadStream('./data/workspace_collaborator.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.workspace_id === req.params.workspaceId) {
        collaborators.push(parseInt(row.user_id, 10));
      }
    })
    .on('end', () => {
      
      collaborators.sort();
      var index = 0;
      var output = [];

      fs.createReadStream('./data/user.csv')
        .pipe(csv())
        .on('data', (row) => {
          if (parseInt(row.id, 10) === collaborators[index]) {
            // I may need to make rows be JSON format.
            output.push(row);
            index += 1;
          }
        })
        .on('end', () => {
          res.statusCode = 200;
          res.json({ collaborators: output });
        });
    });
};

exports.delete_a_workspace = function(req, res) {
  var workspace_head_temp = 'id,name,org_id\n';

  fs.writeFile('./data/workspace_temp.csv', workspace_head_temp, function (err) {
    if (err) {
      console.log(err);
      res.statusCode = 500;
      res.json({ error: ['Could not create the temp workspace file!'] });
    }
  });

  fs.createReadStream('./data/workspace.csv')
    .pipe(csv())
    .on('data', (data) => {
      var rowData = data.id + ',' + data.name + ',' + data.org_id + '\n';

      if (data.id != req.body.workspaceId) {
        fs.appendFile('./data/workspace_temp.csv', rowData, function(err) {
          if (err) {
            console.log(err);
            res.statusCode = 500;
            res.json({ error: ['Could not append row info!'] });
          }
        });
      }
    })
    .on('end', () => {
      fs.rename('./data/workspace_temp.csv', './data/workspace.csv', (err) => {
        if (err) {
          console.log(err);
          res.statusCode = 500;
          res.json({ error: ['Could not rename the temp workspace file!'] });
        }
      });
    });

  var workspace_collaborator_head_temp = 'user_id,workspace_id\n';

  fs.writeFile('./data/workspace_collaborator_temp.csv', workspace_collaborator_head_temp, function (err) {
    if (err) {
      console.log(err);
      res.statusCode = 500;
      res.json({ error: ['Could not create the temp relationship file!'] });
    }
  });

  fs.createReadStream('./data/workspace_collaborator.csv')
    .pipe(csv())
    .on('data', (data) => {
      var rowData = data.user_id + ',' + data.workspace_id + '\n';

      if (data.workspace_id != req.body.workspaceId) {
        fs.appendFile('./data/workspace_collaborator_temp.csv', rowData, function(err) {
          if (err) {
            console.log(err);
            res.statusCode = 500;
            res.json({ error: ['Could not append row info!'] });
          }
        });
      }
    })
    .on('end', () => {
      fs.rename('./data/workspace_collaborator_temp.csv', './data/workspace_collaborator.csv', (err) => {
        if (err) {
          console.log(err);
          res.statusCode = 500;
          res.json({ error: ['Could not rename the temp relationship file!'] });
        }
      });
    });

    res.statusCode = 200;
    res.json({ success: ['Workspace deleted!'] });
}