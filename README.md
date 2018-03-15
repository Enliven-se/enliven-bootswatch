[Bootstrap](http://getbootstrap.com/) [bootswatch](http://bootswatch.com/) for [ENLIVEN](http://www.enliven.co)

Packaged for use with Bower, Node, and Meteor.

Usage:

* Set up: `yarn setup`
  -- (or `npm run setup`)
* Watch & learn: `gulp serve`
* Build: `gulp build`
* Deploy to Github Pages: `gulp deploy`

PLEASE NOTE:

Although this package is required by the `enliven-frontend` project, the presence of a `node_modules` folder inside of this one will cause the build of `enliven-frontend` to fail. So please remove the local `node_modules` folder before building the master project.
