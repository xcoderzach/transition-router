var Router = require('router')
  , classes = require('classes')

function TransitionRouter(opts) {
  var that = this
  var lastPath = document.location.pathname + document.location.search
  var everPushedSomething
  var initialUrl = lastPath

  this.container = opts && opts.container

  this.router = new Router()
  this.context = {}

  window.addEventListener('popstate', function (event) {
    lastPath = document.location.pathname + document.location.search
    var onloadPop = !everPushedSomething && lastPath == initialUrl
    everPushedSomething = true
    if(onloadPop) return

    that.router.dispatch(lastPath)
  })
  that.router.dispatch(lastPath)
}

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
          clearTimeout(id);
        };
}());

function once(el, event, fn) {
  function listen() {
    el.removeEventListener(event, listen)
    return fn.apply(this, arguments)
  }
  return el.addEventListener(event, listen)
}

function afterCalls(number, fn) {
  return function() {
    if(--number === 0)
      return fn.apply(this, arguments)
  }
}
TransitionRouter.prototype.go = function(path, opts) {
  if(opts && opts.replace) {
    window.history.replaceState({}, "title", path)
  } else if(this.lastPath !== path) {
    window.history.pushState({}, "title", path)
  }
  this.lastPath = path
  this.router.dispatch(path)
}

TransitionRouter.prototype.page = function(route, opts, beforeFn, afterFn) {
  var that = this

  this.router.get(route, function() {
    var previousOpts = that.currentOpts
      , fromEl = that.context.el
      , enter, exit
      , args = arguments

    delete that.context.el
    that.currentOpts = opts

    beforeFn.apply(that.context, args)

    if(!that.context.el)
      throw new Error('Page did not set el, transition impossible!')

    if(that.container)
      that.container.appendChild(that.context.el)

    //The first page, don't animate
    if(!fromEl) {
      return classes(that.context.el).add('current-page')
    }
    if(opts.column >= previousOpts.column) {
      enter = 'from-right'
      exit = 'to-left'
    } else {
      enter = 'from-left'
      exit = 'to-right'
    }
    that.transition(fromEl, that.context.el, enter, exit, function() {
      if(that.container)
        that.container.removeChild(fromEl)
      return afterFn && afterFn.apply(that.context, args)
    })
  })
}

TransitionRouter.prototype.transition = function(fromEl, toEl, enter, exit, cb) {
  requestAnimationFrame(function() {
    classes(fromEl).add(exit)
    classes(toEl).add(enter).add('current-page')

    var done = afterCalls(2, function() {
      classes(fromEl).remove(exit).remove('current-page')
      classes(toEl).remove(enter)
      cb()
    })

    once(fromEl, 'webkitAnimationEnd', done)
    once(toEl, 'webkitAnimationEnd', done)
  })
}

module.exports = TransitionRouter
