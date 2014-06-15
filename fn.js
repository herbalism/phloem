define(['phloem', 'when', 'cons/fn'],
       function(phloem, when, fn) {


	   var hasMore = function(xs) {
	       return xs !== phloem.EOF;
	   }

	   var take = fn.take;

	   var drop = fn.drop;

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
	       drop: drop,
	       take: take,
	       iterate: iterate,
	       map: map
	   }
});
