'use strict';

const fs = require('fs');
const csv = require('csv-parser');

exports.list_all_workspaces = function(req, res) {
  var path = './data/workspace.csv';
  var header = 'id,name,org_id,existed\n';
  
  checkFileExistencePromise(path, header)
    .then(function(path) {
      return extractExistedRowDataPromise(path);
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

exports.create_a_workspace = function(req, res) {
  var path = './data/workspace.csv';
  var header = 'id,name,org_id,existed\n';

  checkFileExistencePromise(path, header)
    .then(function(path) {
      return findLastRowIdPromise(path);
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

// This function does not check if it is an existing user id
// since it is for an existing user id.
//
// This function does not check whether the workspaceId is valid or not,
// and we can implement it by iterating the workspace file.
exports.add_an_existing_user_to_a_workspace = function(req, res) {
  var path = './data/workspace_collaborator.csv';
  var header = 'user_id,workspace_id\n';
  var rowData = req.body.userId + ',' + req.params.workspaceId + '\n';

  checkFileExistencePromise(path, header)
    .then(function(path) {
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

exports.list_all_collaborators = function(req, res) {
  var sourcePath = './data/workspace_collaborator.csv';
  var targetPath = './data/user.csv';
  var header = 'user_id,workspace_id\n';
  var condition = req.params.workspaceId;

  checkFileExistencePromise(sourcePath, header)
    .then(function(path) {
      return collectTargetIdsPromise(path, condition);
    })
    .then(function(targetIds) {
      return filterRowDataPromise(targetPath, targetIds);
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

exports.delete_a_workspace = function(req, res) {
  var path = './data/workspace.csv';
  var header = 'id,name,org_id,existed\n';
  var targetId = req.body.workspaceId;

  checkFileExistencePromise(path, header)
    .then(function(path) {
      return extractAllRowDataPromise(path);
    })
    .then(function(rows) {
      return hideRowDataPromise(header, rows, targetId);
    })
    .then(function(rowData) {
      return writeDataPromise(path, rowData);
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

var collectTargetIdsPromise = function(path, condition) {
  return new Promise(function(resolve, reject) {
    var targetIds = [];

    fs.createReadStream(path)
    .on('error', (err) => {
      reject(err);
    })
    .pipe(csv())
    .on('data', (row) => {
      if (row.workspace_id == condition) {
        targetIds.push(parseInt(row.user_id, 10));
      }
    })
    .on('end', () => {
      resolve(targetIds.sort());
    });
  });
};

var filterRowDataPromise = function(path, targetIds) {
  return new Promise(function(resolve, reject) {
    var rows = [];
    var index = 0;
  
    fs.createReadStream(path)
      .on('error', (err) => {
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        if (parseInt(row.id, 10) == targetIds[index]) {
          rows.push(row);
          if (index + 1 < targetIds.length) {
            index += 1;
          }
        }
      })
      .on('end', () => {
        resolve(rows);
      });
  });
};

var findLastRowIdPromise = function(path) {
  return new Promise(function(resolve, reject) {
    var lastRow;

    fs.createReadStream('./data/workspace.csv')
      .on('error', (err) => {
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        lastRow = row;
      })
      .on('end', () => {
        var newWorkspaceId;

        if (lastRow === undefined) {
          newWorkspaceId = 1;
        } else {
          newWorkspaceId = parseInt(lastRow.id, 10) + 1;
        }

        resolve(newWorkspaceId);
      });
  });
};

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

var hideRowDataPromise = function(header, rows, targetID) {
  return new Promise(function(resolve, reject) {
    var i;
    var item;

    for (i = 0; i < rows.length; i++) {
      item = rows[i];

      if (item.id == targetID) {
        if (item.existed == 0) {
          reject('no such item');
        } else {
          item.existed = 0;
          break;
        }
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

var writeDataPromise = function(path, data) {
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
