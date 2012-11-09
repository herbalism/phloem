define(['phloem', 'when'], function(phloem, when) {
    var assert = buster.assert;
    buster.testCase("phloem", {
	"optional": {
	    'absent value can be resolved once' : function() {
		var optional = phloem.optional();
		optional.clear("event");
		 return when(optional.read.absent()).then(function(value) {
		     assert.equals(value, "event");
		 });
	    },
	    'present can be resolved once' : function() {
		var optional = phloem.optional();
		optional.set("value");
		return when(optional.read.present()).then(function(value) {
		    assert.equals(value, "value");
		});
	    },
	    'present can be resolved after absent' : function() {
		var optional = phloem.optional();
		return when("value")
		    .then(optional.clear)
		    .then(optional.read.absent)
		    .then(optional.set)
		    .then(optional.read.present)
		    .then(optional.clear)
		    .then(optional.read.absent)
		    .then(function(value){
			assert.equals(value, "value");
		    });

	    },
	    'absent can be resolved after present' : function() {
		var optional = phloem.optional();
		return when("value")
		    .then(optional.set)
		    .then(optional.read.present)
		    .then(optional.clear)
		    .then(optional.read.absent)
		    .then(optional.set)
		    .then(optional.read.present)
		    .then(function(value){
			assert.equals(value, "value");
		    });

	    }



	},
	"whenever" : {
	    "chain present with whenever" : function() {
		var optional = phloem.optional();
		var dependent = phloem.whenever(optional.read).then(function(value) {
		    return [value, "from dependent"]
		})

		return when("from optional")
		    .then(optional.set)
		    .then(dependent.present)
		    .then(
			function(value) {
			    assert.equals(value, ["from optional", "from dependent"]);
			}
		    );
	    },
	    "chain absent with whenever" : function() {
		var optional = phloem.optional();
		var dependent = phloem.whenever(optional.read).otherwise(function(value) {
		    return [value, "from dependent"]
		})

		return when("from optional")
		    .then(optional.clear)
		    .then(dependent.absent)
		    .then(
			function(value) {
			    assert.equals(value, ["from optional", "from dependent"]);
			}
		    );
	    },
	    "chain can oscillate between absent and present" : function() {
		var optional = phloem.optional();
		var dependent = phloem.whenever(optional.read)
		    .then(function(present){
			return "present: " + present;
		    })
		    .otherwise(function(absent){
			return "absent: " + absent;
		    });
		return when("from optional")
		    .then(optional.set)
		    .then(dependent.present)
		    .then(optional.clear)
		    .then(dependent.absent)
		    .then(optional.set)
		    .then(dependent.present)
		    .then(function(result) {
			assert.equals("present: absent: present: from optional", result);
		    })
		   
	    }
	}
    })
    
    buster.testCase("stream", {
	"- when push -": {
	    "a new value is resolved" : function() {
		var stream = phloem.stream();
		var next = stream.read.next();
		return when("value")
		    .then(stream.push)
		    .then(stream.next)
		    .then(function(value) {
			assert.match(value,
				     {value:"value", next:function(val){
					 return when.isPromise(val)}})
		    });
	    },
	    "more than one new value is resolved" : function() {
		var stream = phloem.stream();
		var next = stream.read.next();
		return when("value")
		    .then(stream.push)
		    .then(stream.next)
		    .then(function(first) {
			stream.push(first.value + " second")
			return first.next})
		    .then(stream.next)
		    .then(function(value) {
			assert.equals(value.value, "value second")
		    });
	    }
	}
    });


    buster.testCase("queue", {
	"- when push -": {
	    "a new value is resolved" : function() {
		var queue = phloem.queue();
		var next = queue.next();
		return when("new value")
		    .then(queue.push)
		    .then(function(){return next})
		    .then(function(entry) {
			assert.match(entry.value, ['new value'])
		    })
	    },
	    "a several values in a row are resolved pre listen" : function() {
		var queue = phloem.queue();
		return when("new value")
		    .then(queue.push)
		    .then(function(val){return queue.push("2. "+val.value)})
		    .then(function(val){return queue.push("3. "+val.value)})
		    .then(queue.next)
		    .then(function(entry) {
			assert.match(entry.value, ['new value', '2. new value', '3. 2. new value'])
		    })
	    },
	    "a several values in a row are resolved post listen" : function() {
		var queue = phloem.queue();
		return when("new value")
		    .then(queue.push)
		    .then(function(val){queue.push("2. "+val.value)
					return val.next})
		    .then(function(val){queue.push("3. "+val.value[0])
					return val.next})
		    .then(function(entry) {
			assert.match(entry.value, ['new value', '2. new value', '3. new value'])
		    })
	    }
	},
	"stream sends EOF on close" : function() {
	    var stream = phloem.stream();
	    var next = stream.read.next();
	    stream.close();

	    return when(next).then(function(value) {
		assert.same(value, phloem.EOF);
	    })
	},
	"always returns EOF after close" : function() {
	    var stream = phloem.stream();
	    stream.close();
	    return when(stream.read.next()).then(function(value) {
		assert.same(value, phloem.EOF);
	    })
	}

    })

    buster.testCase("filter", {
	"lets through strings matching regex" : function() {
	    var stream = phloem.stream();
	    var filtered = phloem.filter(stream.read.next(), /a+/);

	    var promise = when(filtered.read.next())
	    stream.push("aaaa");

	    return promise.then(function(val) {
		assert.match(val, {value: "aaaa"});
	    });

	},
	"does not let through strings not matching regex" : function() {
	    var stream = phloem.stream();
	    var filtered = phloem.filter(stream.read.next(), /a+/);

	    var promise = when(filtered.read.next())
	    stream.push("bbbb");
	    stream.push("aaaa");

	    return promise.then(function(val) {
		assert.match(val, {value: "aaaa"});
	    })
	},
	"lets groupmatches through as arrays" : function() {
	    var stream = phloem.stream();
	    var filtered = phloem.filter(stream.read.next(), /(a+)(b+)/);

	    var promise = when(filtered.read.next())
	    stream.push("aaaabb");

	    return promise.then(function(val) {
		assert.match(val, {value: ["aaaa", "bb"]});
	    });

	},
	"function that returns falsey does not match" : function() {
	    var stream = phloem.stream();
	    var filtered = phloem.filter(stream.read.next(), function(val){if(val === "abc"){return "hepp"}});

	    var promise = when(filtered.read.next())
	    stream.push("abcd");
	    stream.push("abc");

	    return promise.then(function(val) {
		assert.match(val, {value: "hepp"});
	    });

	},
	"unmatched item can be read" : function() {
	    var stream = phloem.stream();
	    var filter = phloem.filter(stream.read.next(), /abc/);

	    var matched = filter.read.next();
	    var unmatched = filter.read.unmatched();
	    var promise = when.all([matched, unmatched]);

	    stream.push("abc");
	    stream.push("ddd");

	    return promise.then(function(vals) {
		assert.match(vals, [{value:'abc'}, {value:'ddd'}]);
	    });
	}
    }),

    buster.testCase("eitherStream", {
	"left when left stream writes": function(){
	    var left = phloem.stream();
	    var right = phloem.stream();
	    var eitherStream = phloem.eitherStream(left.read.next(), right.read.next());
	    

	    promise =  when(eitherStream.read.left())
	    
	    left.push("left");

	    return promise.then(function(stream) {
		assert.match(stream, {value: "left"});
	    })
	},
	"right when right stream writes": function(){
	    var left = phloem.stream();
	    var right = phloem.stream();
	    var eitherStream = phloem.eitherStream(left.read.next(), right.read.next());
	    

	    promise =  when(eitherStream.read.right())
	    
	    right.push("right");

	    return promise.then(function(stream) {
		assert.match(stream, {value: "right"});
	    })
	},
	"closes left when switching to right" : function() {
	    var left = phloem.stream();
	    var right = phloem.stream();
	    var eitherStream = phloem.eitherStream(left.read.next(), right.read.next());

	    var eitherLeft = eitherStream.read.left();
	    var eitherRight = eitherStream.read.right();
	    promise = when(eitherLeft)
		.then(function(val) {
		    assert.match(val, {value: "left value"});
		    right.push("switched to right");
		    return val.next;
		})
		.then(function(val) {
		    assert.same(val, phloem.EOF);
		    return eitherRight
		})
		.then(function(val) {
		    assert.match(val, {value: "switched to right"});
		})
		    
	    left.push("left value");
	    return promise;
	}
    })

})

