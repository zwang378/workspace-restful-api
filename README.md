# Workspace RESTful API

This project follows MVC design. Since data entries are in csv files, this project uses csv files to read and write data.

This RESTful API performs the following functions.

1. Create a new workspace
2. List workspaces
3. Add an existing user as a collaborator to an existing workspace
4. List the collaborators of a workspace
5. Delete a workspace

## Getting Started

These instructions will let you know how to install and run this project.

### Prerequisites

Please install Node, NPM, and Express, so you can install and run this project.

### Installing

Please install project dependencies

```
npm install
```

It's a good idea to install nodemon because it can restart the app automatically when there is a change in the project.

```
npm install -g nodemon
```

## Use this API

Please see below to use five features in this app.

### Create a new workspace

You need to provide name and org_ig. The id for the new workspace would be generated automatically.

For example, you can create a new workspace by using the following command. The workspace name is Eleven, and this workspace belongs to org_id 9.

```
$ curl -d "name=Eleven&org_id=9" -X POST http://localhost:3000/workspace
{"message":["success"]}
```

### List workspace

The response would have all workspaces and their information, including id, name, and org_id.

```
$ curl -X GET http://localhost:3000/workspace
{"message":["success"],"workspaces":[{"id":"1","name":"Cardify","org_id":"1","existed":"1"},{"id":"4","name":"Aerified","org_id":"3","existed":"1"},{"id":"5","name":"Tresom","org_id":"4","existed":"1"},{"id":"6","name":"Asoka","org_id":"4","existed":"1"},{"id":"7","name":"Pannier","org_id":"5","existed":"1"},{"id":"8","name":"Sonsing","org_id":"6","existed":"1"},{"id":"9","name":"Bigtax","org_id":"7","existed":"1"},{"id":"10","name":"Stronghold","org_id":"9","existed":"1"}]}
```

### Add an existing user as a collaborator to an existing workspace

The following command would add one more relationship. The userId is 5, and it's for workspace 6.

```
$ curl -d "userId=5" -X POST http://localhost:3000/workspace/6/user
{"message":["success"]}
```

### List the collaborators of a workspace

The following command would list all users under the workspace 1.

```
$ curl -X GET http://localhost:3000/workspace/1/user
{"message":["success"],"users":[{"id":"1","name":"Hewe Kettleson","email":"hkettleson0@yellowpages.com","existed":"1"},{"id":"2","name":"Hershel Hamerton","email":"hhamerton1@rakuten.co.jp","existed":"1"},{"id":"3","name":"Andonis Gatheral","email":"agatheral2@dailymail.co.uk","existed":"1"}]}
```

### Delete a workspace

The following command would delete the workspaceId 2 from the workspace, and delete the relationship with users at the same time.

```
curl -d "workspaceId=1" -X DELETE http://localhost:3000/workspace
{"message":["success"]}
```
