var Router = require('router')
  , classes = require('classes')

function TransitionRouter(opts) {
  var that = this
  var lastPath = document.location.pathname + document.location.search
  var everPushedSomething
  var initialUrl = lastPath
  that.transitioning = false

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
  if(number === 0) {
    setTimeout(function() { fn.apply(this, arguments) }, 16)
  }
  return function() {
    if(--number === 0)
      return fn.apply(this, arguments)
  }
}
TransitionRouter.prototype.go = function(path, opts) {
  if(opts && opts.replace) {
    window.history.replaceState({}, "title", path)
  } else if(this.lastPath !== path) {
    // window.history.pushState({}, "title", path)
  }

  if(opts && opts.noTransition)
    this.noTransition = true

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

    if(that.transitioning) return

    that.transitioning = true

    delete that.context.el
    that.currentOpts = opts

    beforeFn.apply(that.context, args)

    if(!that.context.el)
      throw new Error('Page did not set el, transition impossible!')

    if(that.container)
      that.container.appendChild(that.context.el)

    //The first page, don't animate
    if(!fromEl) {
      that.transitioning = false
      return classes(that.context.el).add('current-page')
    }
    if(that.noTransition) {
      enter = false
      exit = false
      that.noTransition = false
    } else if(opts.overlayTop) {
      enter = 'from-top'
      exit = false
    } else if (previousOpts.overlayTop) {
      enter = false
      exit = 'to-top'
    } else if(opts.column >= previousOpts.column) {
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
  var that = this
  requestAnimationFrame(function() {

    if(exit) classes(fromEl).add(exit)
    if(enter) classes(toEl).add(enter)

    classes(toEl).add('current-page')

    var calls = ((exit) ? 1: 0) + ((enter) ? 1: 0)

    var done = afterCalls(calls, function() {
      if(exit) classes(fromEl).remove(exit)
      classes(fromEl).remove('current-page')
      if(enter) classes(toEl).remove(enter)
      cb()
      that.transitioning = false
    })

    once(fromEl, 'webkitAnimationEnd', done)
    once(toEl, 'webkitAnimationEnd', done)
  })
}

module.exports = TransitionRouter
