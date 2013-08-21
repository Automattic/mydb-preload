
/**
 * Module dependencies.
 */

var log = require('log');
var conf = require('config');
var Response = require('express').response;
var debug = require('debug')('mydb-preload');

/**
 * Module exports.
 */

module.exports = middleware;

/**
 * Marks a resource for preloading.
 *
 * @param {String} url that identifies this resource
 * @param {Object|Promise} document (with `_id`) or promise
 * @param {Object|String|Array} optional, fields to subscribe to
 * @api public
 */

Response.preload = function(url, data, fields){
  if (!this.mydbDocs) {
    this.mydbDocs = [];
    this.mydbPending = 0;
  }

  var self = this;
  var error = false;
  this.mydbPending++;
  debug('%d mydb preloads pending', this.mydbPending);

  if (data.fulfill) {
    data.on('complete', function(err, doc){
      if (err) return onerror(err);
      if (!doc) return done();
      preload(doc, fields || data.opts.fields);
    });
  } else {
    preload(data, fields);
  }

  function preload(doc, fields){
    self.subscribe(doc._id, fields, function(err, sid){
      if (err) return onerror(err);

      debug('registering preload %s (%s): %j', url, sid, doc);
      self.mydbDocs.push({ url: url, doc: doc, sid: sid });

      done();
    });
  }

  function done(){
    --self.mydbPending || self.emit('mydb preloads flush');
  }

  function onerror(err){
    if ('development' == conf.env) {
      var state = /ECONN/.test(err.message) ? 'running' : 'up to date';
      console.warn('\n\033[31mMake sure cloudup-io is %s!\033[39m\n', state);
    }

    if (error) {
      log.error('mydb preload error', err);
    } else {
      self.req.next(err);
      error = true;
    }
  }
};

/**
 * Middleware to ensure all preloads are ready.
 *
 * @api public
 */

function middleware(){
  return function preloaded(req, res, next){
    if (res.mydbPending) {
      debug('waiting for preloads to complete');
      res.once('mydb preloads flush', next);
    } else {
      debug('preloads completed - proceeding');
      process.nextTick(next);
    }
  };
}
