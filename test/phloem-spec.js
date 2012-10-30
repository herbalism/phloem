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
	}
    })
})