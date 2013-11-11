(function() {
  var Router = require('transition-router')
    , router = new Router({ container: document.getElementById('container') })

  describe('when I setup two routes', function() {
    before(function() {
      var that = this
      router.page('/first', { column: 0 }, function() {
        that.firstEl = this.el = document.createElement('div')
      })
      router.page('/second', { column: 1 }, function() {
        that.secondEl = this.el = document.createElement('div')
      })
      router.go('/first')
    })

    after(function() {
      router.go('/test/index.html')
    })
    it('should not start the animation syncronously', function() {
      expect(this.firstEl.classList.contains('current-page')).to.be.ok
    })
    it('should transition in the right direction', function(done) {
      var that = this
      router.go('/second')
      that.firstEl.addEventListener('webkitAnimationStart', function check1() {
        that.firstEl.removeEventListener('webkitAnimationStart', check1)
        expect(that.firstEl.classList.contains('to-left')).to.be.true
        expect(that.secondEl.classList.contains('from-right')).to.be.true

        expect(that.firstEl.classList.contains('current-page')).to.be.true
        expect(that.secondEl.classList.contains('current-page')).to.be.true

        router.go('/first')
        that.firstEl.addEventListener('webkitAnimationStart', function check2() {
          that.firstEl.removeEventListener('webkitAnimationStart', check2)
          expect(that.firstEl.classList.contains('from-left')).to.be.true
          expect(that.secondEl.classList.contains('to-right')).to.be.true

          expect(that.secondEl.classList.contains('current-page')).to.be.true
          expect(that.firstEl.classList.contains('current-page')).to.be.true
          done()
        })
      })
    })
    it('should call the second callback once the transitions are done', function(done) {
      var that = this
      router.page('/third', { column: 3 }, function() {
        that.thirdEl = this.el = document.createElement('div')
      }, function() {
        expect(this.el).to.equal(that.thirdEl)
        expect(that.thirdEl.classList.contains('current-page')).to.be.true

        expect(that.thirdEl.parentNode.id).to.equal('container')
        expect(that.firstEl.parentNode).to.equal(null)
        expect(that.secondEl.parentNode).to.equal(null)

        expect(that.thirdEl.classList.length).to.equal(1)
        done()
      })
      router.go('/third')
    })
  })

}())