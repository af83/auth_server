callbacks = {

  get_waiter: function(calls_needed, callback, fallback){
      /* Returns a function which will call the given
       * callback once it has been called calls_needed times.
       * If calls_needed is 0, then the callback is immediatly called.
       * If waiter.fall() is called, then the fallback is called with the same 
       * arguments it was given.
       *
       * NOTE: taken from nodetk (http://github.com/AF83/nodetk).
       */
      if(calls_needed == 0) callback();
      var ok = true;
      var waiter = function(){
        --calls_needed;
        if(calls_needed == 0 && ok) callback();
        // XXX: should we raise an error if waiter called too many times?
      };
      waiter.fall = function() {
        ok = false;
        fallback && fallback.apply(this, arguments);
      };
      return waiter;
    }

};

