# VolCast
WebGL based Volume rendering done by ray casting using "fake" 3D texture. This will be a volume renderer resides solely in the browser, so check out the gh-page for the codes.

## Build Process

First, install global packages. We rely on bower for front end packages and gulp for the build process.
```
npm install -g bower
npm install -g gulp
```

Then we need to install the local packages with both npm and bower.
```
npm intall
bower install
```

To build, just run
```
gulp
```

When built sucessfully, the contents in the dist directory is the final website.

## Deployment

Since our volume renderer is strictly front end only, we are hosting it using github pages, so the branch gh-pages is the deployment branch. To deploy, just upload the contents in the dist directory to gh-pages.