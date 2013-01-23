define(['phloem'],
       function(phloem) {
	   var iterate = function(iterator, initial) {

	       var iteration = function(current) {
		   return phloem.cons(current, 
			       function() {
				   return when(iteration(current));
			       });
	       }
	       return iteration(iterator(initial));
	   }

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

	   return {
	       take: take,
	       iterate: iterate
	   }
});
