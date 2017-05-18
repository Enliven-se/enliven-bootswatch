Package.describe({
  name: "enliven:enliven-bootswatch",
  summary: "ENLIVEN basic styles package",
  version: '0.4.0',
  git: "https://gitlab.com/enliven/enliven-bootswatch.git"
});

Package.onUse(function (api) {

  api.versionsFrom(['METEOR@1.0']);

  api.use([
    'vulcan:core@1.3.2',
    'fourseven:scss@4.5.0',
  ]);

  api.addFiles([
    './_variables.scss',
    './_bootswatch.scss'
  ], ['client']);

});
