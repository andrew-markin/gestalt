# Gestalt

Gestalt is a simple open-source TODO application that supports subtasks. Gestalts can be easily shared by their URL addresses and therefore can be used for collaboration of few people. With Gestalt you can make sure that everything goes as it should and nothing is missed.

Application is running here: https://gestalt.work

## Project setup

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
