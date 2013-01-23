define(['phloem'],
       function(phloem) {


	   var hasMore = function(xs) {
	       return xs !== phloem.EOF;
	   }

	   var take = function(xs, count) {
	       return when(xs).then(
		   function(val) {
		       return (hasMore(val) && count > 0) ? 
			   phloem.cons(phloem.value(val), take(phloem.next(val), count-1)) : 
			   phloem.EOF;
		   });
	   }

	   var iterate = function(iterator, initial) {
	       var iteration = function(current) {
		   return phloem.cons(current, 
			       function() {
				   return when(iteration(iterator(current)));
			       });
	       }
	       return iteration(iterator(initial));
	   }

	   var map = function(stream, fn) {
	       var iteration = function(stream) {
		   return when(stream).then(function(resolved) {
		       if(resolved === phloem.EOF) return resolved;
		       return phloem.cons(
			   fn(phloem.value(resolved)), 
			   function() {
			       return iteration(phloem.next(resolved));
			   });
		   });
	       }
	       return iteration(stream);
	   }

	   return {
	       take: take,
	       iterate: iterate,
	       map: map
	   }
});
