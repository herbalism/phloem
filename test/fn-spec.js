define(['fn', 'phloem', 'when'], 
       function(fn, phloem, when) {
	   
	   var assert = buster.assert;

	   buster.testCase("take", {
	       'take 1 from stream with 1 has one element': function() {
		   var stream = phloem.stream();
		   var next = stream.read.next();
		   stream.push("first");
		   stream.close();
		   return when(fn.take(next, 1)).then(
		       function(cons) {
			   assert.equals(cons.value, "first");
			   return phloem.next(cons);
		       }).then(function(cons) {
			   assert.same(cons, phloem.EOF);
		       })
		   
	       },
	       'take 2 from stream with 3 has 2 elements': function() {
		   var stream = phloem.stream();
		   var next = stream.read.next();
		   stream.push("first");
		   stream.push("second");
		   stream.push("third");
		   stream.close();
		   return when(fn.take(next, 2)).then(
		       function(cons) {
			   assert.equals(cons.value, "first");
			   return phloem.next(cons);
		       }).then(function(cons) {
			   assert.equals(cons.value, "second");
			   return phloem.next(cons);
		       }).then(function(cons) {
			   assert.same(cons, phloem.EOF);
		       });
		   
	       }
	   });

	   buster.testCase("iterate", {
	       "iterate constant fn makes infinite stream of result" : function() {
		   var res = fn.iterate(function(last){return 1;});
		   return when(fn.take(res, 3)).
		       then(function (cons) {
			   assert.equals(1, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.equals(1, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.equals(1, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.same(phloem.EOF, cons);
		       });
	       },
	       "iterate inc fn makes infinite stream of result" : function() {
		   var res = fn.iterate(function(last){
		       return last+1;}, 0);
		   return when(fn.take(res, 3)).
		       then(function (cons) {
			   assert.equals(1, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.equals(2, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.equals(3, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.same(phloem.EOF, cons);
		       });
	       }

	   });

	   buster.testCase("map", {
	       "map returns a new stream with the result of fn applied to values in input" : function() {
		   var initial = fn.iterate(function(last){return last+1;}, 0);
		   var mapped = fn.map(initial, function(val) {return val * val});

		   return when(fn.take(mapped, 3)).
		       then(function (cons) {
			   assert.equals(1, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.equals(4, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.equals(9, phloem.value(cons));
			   return phloem.next(cons);
		       }).
		       then(function (cons) {
			   assert.same(phloem.EOF, cons);
		       });
	       },
	       'map 1 from stream with 1 has one element': function() {
		   var stream = phloem.stream();
		   var next = stream.read.next();
		   stream.push(1);
		   stream.close();
		   return when(fn.map(next, function(value){return value + "st"})).then(
		       function(cons) {
			   assert.equals(cons.value, "1st");
			   return phloem.next(cons);
		       }).then(function(cons) {
			   assert.same(cons, phloem.EOF);
		       })
		   
	       }

	   });
});
