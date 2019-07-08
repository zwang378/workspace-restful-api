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

End with an example of getting some data out of the system or using it for a little demo

## Use this app

Please see below to use five features in this app.

### Create a new workspace

You need to provide name and org_ig. The id for the new workspace would be generated automatically.

For example, you can create a new workspace by using the following command. The workspace name is Eleven, and this workspace belongs to org_id 9.

```
curl -d "name=Eleven&org_id=9" -X POST http://localhost:3000/workspace
```

### List workspace

The response would have all workspaces and their information, including id, name, and org_id.

```
curl -X GET http://localhost:3000/workspace
```

### Add an existing user as a collaborator to an existing workspace

The following command would add one more relationship. The userId is 5, and it's for workspace 6.

```
curl -d "userId=5" -X POST http://localhost:3000/workspace/6/user
```

### List the collaborators of a workspace

The following command would list all users under the workspace 2.

```
curl -X GET http://localhost:3000/workspace/2/user
```

### Delete a workspace

The following command would delete the workspaceId 2 from the workspace, and delete the relationship with users at the same time.

```
curl -d "workspaceId=2" -X DELETE http://localhost:3000/workspace
```
