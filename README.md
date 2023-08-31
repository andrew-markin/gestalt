# Gestalt

Gestalt is a straightforward open-source task management application that supports subtasks. It enables easy collaboration among multiple users as Gestalts can be shared using unique URL addresses. With Gestalt, you can ensure that all tasks are completed efficiently and nothing is overlooked.

Access the application at https://gestalt.work

## Project setup

### Install dependencies

    $ npm install

### Prepare environment variables

Create *.env.development.local* and/or *.env.production.local* file in the project root (.env.example can be used for reference). Make sure there is the [Appository Sync](https://github.com/andrew-markin/appository-sync) server running for data synchronization and correct VUE_APP_TOKEN environment variable is set for application authorization.

### Compiles and hot-reloads for development

    $ npm run serve

### Compiles and minifies for production

    $ npm run build

### Lints and fixes files

    $ npm run lint

## License

This repository is available under the [GNU General Public License](./LICENSE).
