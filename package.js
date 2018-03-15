Package.describe({
  name: 'enliven:enliven-bootswatch',
  summary: 'ENLIVEN basic styles package',
  version: '0.8.0',
  git: 'https://gitlab.com/enliven/enliven-bootswatch.git'
});

Package.onUse(function(api) {
  api.versionsFrom(['METEOR@1.0']);

  api.use(['vulcan:core', 'fourseven:scss@4.5.4']);

  api.addFiles(['app/styles/client.scss'], ['client']);

  // api.addAssets([
  //   'app/images/logo.png',
  //   'app/images/logo-ffffff.png',
  //   'app/images/enliven-logo-footer.png',
  // ], ['client']);
});
