define (['when'], function(when) {
    var EOF = {
    }
    EOF.next = when(EOF);

    
    var optional = function (val) {
	var value = value;
	var absent = when.defer();
	var present = when.defer();
	var result;

	var set = function(newValue) {
	    if(newValue) {
		value = newValue;
		absent = when.defer();
		present.resolve(value);
	    }
	    return newValue;
	}

	var clear = function(event) {
	    value = undefined;
	    present = when.defer();
	    absent.resolve(event);
	    return event;
	}


	result = {
	    read: {
		absent: function() {return absent.promise},
		present: function() {return present.promise}
	    },
	    set:set,
	    clear:clear
	}
	
	if(val) {
	    return set(val);
	}

	return result;

    }

    var whenever = function(dependency) {
	var result = optional();
	var present;
	var absentHandler, presentHandler;
	var getAbsent = function () {
	    return absentHandler;
	}
	var getPresent = function() {
	    return presentHandler;
	}

	var swap = function(state, handler, action, other, otherHandler) {
	    when(state()).then(
		function(value) {
		    var res = action(handler(value));
		    other(otherHandler());
		    return res;
		});
	    return result.read;
	}

	var absent = function(handler) {
	    absentHandler = handler;
	    return swap(dependency.absent, handler, result.clear, present, getPresent)
	}

	result.read.otherwise = absent;

	present = function(handler) {
	    presentHandler = handler;
	    return swap(dependency.present, handler, result.set, absent, getAbsent)
	}

	return  {
	    then: present,
	    otherwise: absent
  	}
    } 


    var stream = function() {
	var nextValue = when.defer();
	return {
	    push: function(value){
		var old = nextValue;
		nextValue = when.defer();
		return old.resolve({value:value, next:nextValue.promise});
	    },
	    close: function() {
		nextValue.resolve(EOF);
	    },
	    read: {
		next: function(){
		    return nextValue.promise
		}
	    }
	}
    }

    var queue = function() {
	var input = stream();
	var rootQueue = input.read.next()
	var snapshot = [];
	var aggregate = function(snapshot) {
	    return function(element) {
		var acc = snapshot.concat([element.value]);
		if(element.next === input.read.next()) {
		    return {value: acc, next: when(element.next).then(aggregate(acc))}
		}
		else {
		    return when(element.next).then(aggregate(acc))
		}
	    }
	}

	return {
	    next: function(){
		return when(rootQueue).then(aggregate(snapshot))
	    },
	    push: function(value) {
		return when(input.push(value)).then(aggregate(snapshot));
	    }
	}
    };


    var iterate = function(next, callback) {
	return when(next).then(
	    function(val) {
		callback(val.value);
		iterate(val.next, callback);
	    }
	)
    }

    var filter = function(next, condition) {
	var passed = stream();
	var doMatch = condition;
	if((typeof condition) != "function") {
	    doMatch = function(val) {
		var match = condition.exec(val)
		return match && (match.length > 1 ? match.slice(1) : match[0])
	    }
	}

	iterate(next, function(val) {
	    var match = doMatch(val)
	    match && passed.push(match)
	});
	return {read: passed.read};
    }

    return {
	optional: optional,
	whenever: whenever,
	stream: stream,
	queue: queue,
	filter: filter,
	iterate: iterate,
	EOF: EOF
    }
})
