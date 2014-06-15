define(['phloem', 'when', 'cons/fn'],
       function(phloem, when, fn) {
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
	       drop: fn.drop,
	       take: fn.take,
	       iterate: fn.iterate,
	       map: map
	   }
});
