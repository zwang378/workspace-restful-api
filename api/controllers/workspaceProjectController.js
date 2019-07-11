'use strict';

const fs = require('fs');
const csv = require('csv-parser');

exports.listAllWorkspaces = function(req, res) {
  var path = './data/workspace.csv';
  var header = 'id,name,org_id,existed\n';
  
  checkFileExistencePromise(path, header)
    .then(function(availablePath) {
      return extractExistedRowDataPromise(availablePath);
    })
    .then(function(result) {
      res.statusCode = 200;
      res.json({ 
        message: ['success'],
        workspaces: result
       });
    })
    .catch(function(err) {
      res.statusCode = 500;
      res.json({ message: [err] });
    });
};

exports.createAWorkspace = function(req, res) {
  var path = './data/workspace.csv';
  var header = 'id,name,org_id,existed\n';

  checkFileExistencePromise(path, header)
    .then(function(availablePath) {
      return findNewRowIdPromise(availablePath);
    })
    .then(function(newRowId) {
      var rowData = newRowId + ',' + req.body.name + ',' + req.body.org_id + ',' + '1' + '\n';
      return appendRowDataPromise(path, rowData);
    })
    .then(function(result) {
      res.statusCode = 200;
      res.json({ message: [result] });
    })
    .catch(function(err) {
      res.statusCode = 500;
      res.json({ message: [err] });
    });
};

exports.addAnExistingUserToAWorkspace = function(req, res) {
  var WCPath = './data/workspace_collaborator.csv';
  var WOPath = './data/workspace.csv';
  var UOPath = './data/user_organization.csv';
  var header = 'user_id,workspace_id,existed\n';
  var rowData = req.body.userId + ',' + req.params.workspaceId + ',' + '1' + '\n';

  checkFileExistencePromise(WCPath, header)
    .then(function(availablePath) {
      // console.log(availablePath);
      return findOrganizationBasedOnWorkspace(WOPath, req.params.workspaceId);
    })
    .then(function(orgIdWithWorkspace) {
      return checkUserOrganizationRelationship(UOPath, req.body.userId, orgIdWithWorkspace);
    })
    .then(function(isAllowed) {
      // console.log(isAllowed);
      return appendRowDataPromise(WCPath, rowData);
    })
    .then(function(result) {
      res.statusCode = 200;
      res.json({ message: [result] });
    })
    .catch(function(err) {
      res.statusCode = 500;
      res.json({ message: [err] });
    });
};

exports.listAllCollaborators = function(req, res) {
  var sourcePath = './data/workspace_collaborator.csv';
  var targetPath = './data/user.csv';
  var header = 'user_id,workspace_id,existed\n';
  var condition = req.params.workspaceId;

  checkFileExistencePromise(sourcePath, header)
    .then(function(availablePath) {
      return collectTargetIdsPromise(availablePath, 'workspace_id', condition, 'user_id');
    })
    .then(function(targetIds) {
      return filterRowDataPromise(targetPath, 'id', targetIds);
    })
    .then(function(result) {
      res.statusCode = 200;
      res.json({ 
        message: ['success'],
        users: result
       });
    })
    .catch(function(err) {
      res.statusCode = 500;
      res.json({ message: [err] });
    });
};

exports.deleteAWorkspace = function(req, res) {
  var workspacePath = './data/workspace.csv';
  var workspaceHeader = 'id,name,org_id,existed\n';
  var workspaceCollaboratorPath = './data/workspace_collaborator.csv';
  var workspaceCollaboratorHeader = 'user_id,workspace_id,existed\n';
  var targetId = req.body.workspaceId;

  checkFileExistencePromise(workspacePath, workspaceHeader)
    .then(function(availablePath) {
      return extractAllRowDataPromise(availablePath);
    })
    .then(function(rows) {
      return hideRowDataPromise(workspaceHeader, rows, 'id', targetId);
    })
    .then(function(rowData) {
      return overwriteDataPromise(workspacePath, rowData);
    })
    .then(function(result) {
      // console.log('operation 1: ' + result);
      return checkFileExistencePromise(workspaceCollaboratorPath, workspaceCollaboratorHeader);
    })
    .then(function(availablePath) {
      return extractAllRowDataPromise(availablePath);
    })
    .then(function(rows) {
      return hideRowDataPromise(workspaceCollaboratorHeader, rows, 'workspace_id', targetId);
    })
    .then(function(rowData) {
      return overwriteDataPromise(workspaceCollaboratorPath, rowData);
    })
    .then(function(result) {
      res.statusCode = 200;
      res.json({ 
        message: [result]
       });
    })
    .catch(function(err) {
      res.statusCode = 500;
      res.json({ message: [err] });
    });
}

/**
 * Make the target path available. If it exists, let it be.
 * If not, create one.
 * @param  {String} path   The path you want to check out the availability
 * @param  {String} header The header you want have if it is going to generate new file
 * @return {String}        The path that is available
 */
var checkFileExistencePromise = function(path, header) {
  return new Promise(function(resolve, reject) {
    fs.access(path, fs.F_OK, (unavailable) => {
      if (unavailable) {        
        fs.writeFile(path, header, function (err) {
          if (err) reject(err);
        });
      }

      resolve(path);
    });
  });
};

/**
 * Extract all row data
 * @param  {String}     path The file that you want to extract data from
 * @return {JSON array}      All row data which is an array of JSON objects
 */
var extractAllRowDataPromise = function(path) {
  return new Promise(function(resolve, reject) {
    var rows = [];
  
    fs.createReadStream(path)
      .on('error', (err) => {
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve(rows);
      });
  });
};

/**
 * Extract row data that marked as existed
 * @param  {String}     path The file that you want to extract data from
 * @return {JSON array}      All row data which is an array of JSON objects
 */
var extractExistedRowDataPromise = function(path) {
  return new Promise(function(resolve, reject) {
    var rows = [];
  
    fs.createReadStream(path)
      .on('error', (err) => {
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        if (row['existed'] == '1') {
          rows.push(row);
        }
      })
      .on('end', () => {
        resolve(rows);
      });
  });
};

/**
 * Collect row IDs that match your condition
 * @param  {String}       path      The file that you want to collect conditions from
 * @param  {String}       targetCol The column name where your condition is
 * @param  {String}       condition The target string that you look for
 * @return {Number array}           All sorted IDs that match your condition
 */
var collectTargetIdsPromise = function(path, targetCol, condition, resultCol) {
  return new Promise(function(resolve, reject) {
    var targetIds = [];

    fs.createReadStream(path)
    .on('error', (err) => {
      reject(err);
    })
    .pipe(csv())
    .on('data', (row) => {
      if (row[targetCol] == condition && row['existed'] == 1) {
        targetIds.push(parseInt(row[resultCol], 10));
      }
    })
    .on('end', () => {
      resolve(targetIds.sort());
    });
  });
};

/**
 * Find row IDs that match your target IDs
 * @param  {String}      path      The file that contains data you are looking for
 * @param  {String}      targetCol The column name where your target is
 * @param  {String}      targetIds The target IDs that contain your condition
 * @return {JSON array}            Row data that match your condition
 */
var filterRowDataPromise = function(path, targetCol, targetIds) {
  return new Promise(function(resolve, reject) {
    var rows = [];
    var index = 0;
  
    fs.createReadStream(path)
      .on('error', (err) => {
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        if (parseInt(row[targetCol], 10) == targetIds[index]) {
          if (index + 1 < targetIds.length) {
            index += 1;
          }
          if (row['existed'] == 1) {
           rows.push(row);
          }
        }
      })
      .on('end', () => {
        resolve(rows);
      });
  });
};

/**
 * Find the last row ID plus one for you, so you can add new row data based on this
 * @param  {String} path The file that you want to find the last row ID plus one
 * @return {Number}      The last row ID plus one
 */
var findNewRowIdPromise = function(path) {
  return new Promise(function(resolve, reject) {
    var lastRow;

    fs.createReadStream(path)
      .on('error', (err) => {
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        lastRow = row;
      })
      .on('end', () => {
        var newId;

        if (lastRow === undefined) {
          newId = 1;
        } else {
          newId = parseInt(lastRow.id, 10) + 1;
        }

        resolve(newId);
      });
  });
};

/**
 * Append row data to your target file
 * @param  {String} path    The file that you want to append your data to
 * @param  {String} rowData Row data you want them to be appended
 * @return {String}         A message to let you know it is successful or not
 */
var appendRowDataPromise = function(path, rowData) {
  return new Promise(function(resolve, reject) {
    fs.appendFile(path, rowData, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve('success');
      }
    });
  });
};

/**
 * Make data "existed" 0 instead of removing data
 * @param  {String}     header    The header of your target file
 * @param  {JSON array} rows      Data which contain data entry you want to delete
 * @param  {String}     targetCol The column that contains the item you want to delete
 * @param  {String}     targetID  The ID of the item that you want to delete
 * @return {String}               A string has the whole csv file which is ready to be written to a file
 */
var hideRowDataPromise = function(header, rows, targetCol, targetID) {
  return new Promise(function(resolve, reject) {
    var i;
    var item;

    for (i = 0; i < rows.length; i++) {
      item = rows[i];

      if (item[targetCol] == targetID) {
        item.existed = 0;
      }
    }

    var stringForWriting = header;

    for (i = 0; i < rows.length; i++) {
      for (var key in rows[i]) {
        stringForWriting += rows[i][key];
        stringForWriting += ',';
      }
      stringForWriting = stringForWriting.slice(0, -1);
      stringForWriting += '\n';
    }

    resolve(stringForWriting);
  });
};

/**
 * Receive a string and write it on a file
 * @param  {String} path The file that you want to write your data to
 * @param  {String} data Data you want them to be written
 * @return {String}      A message to let you know it is successful or not
 */
var overwriteDataPromise = function(path, data) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, data, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve('success');
      }
    });
  });
};

/**
 * Find the organization that owns this workspace
 * @param  {String} workspaceOrganization The workspace file that contains organizations
 * @param  {String} workspaceId           The workspace that is owned by the organization we are going to find
 * @return {String}                       Organization ID which own this workspace
 */
var findOrganizationBasedOnWorkspace = function(workspaceOrganization, workspaceId) {
  return new Promise(function(resolve, reject) {
    var orgIdResult;

    fs.createReadStream(workspaceOrganization)
      .on('error', (err) => {
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        if (row['id'] == workspaceId && row['existed'] == 1) {
          orgIdResult = row['org_id'];
        }
      })
      .on('end', () => {
        if (orgIdResult == undefined) {
          reject('Could not find your workspace');
        } else {
          resolve(orgIdResult);
        }
      });
  });
};
 
/**
 * Check whether this user is at this organization or not
 * @param  {String} userOrganization The user/organization file that contains their relationship
 * @param  {String} userId           The user you want to check out
 * @param  {String} orgId            The organization you want to check out
 * @return {String}                  The result that shows the relationship exists or not
 */
var checkUserOrganizationRelationship = function(userOrganization, userId, orgId) {
  return new Promise(function(resolve, reject) {
    var userOrganizationRelationship = 0;

    fs.createReadStream(userOrganization)
      .on('error', (err) => {
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        if (row['user_id'] == userId && row['org_id'] == orgId && row['existed'] == 1) {
          userOrganizationRelationship = 1;
        }
      })
      .on('end', () => {
        if (userOrganizationRelationship == 1) {
          resolve(1);
        } else {
          reject('Please add this user to the corresponding organization first');
        }
      });
  });
};