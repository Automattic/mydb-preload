
mydb-preload
============

Express helper to preload mydb documents 

## How to use

In your middleware, call `preload` with a given `url` and the respective
promise:

```js
require('mydb-preload'); // to extend the response prototype

app.use(function(req, res, next){
  res.preload('/user', db.findOne(req.session.userId));
});
```

Then make sure to include the respective middleware in the routes
that will expose the documents:

```js
var preload = require('mydb-preload');
app.get('/', preload(), function(req, res, next){
  res.render('homepage.jade');
});
```
