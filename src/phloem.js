define (['when'], function(when) {
    var EOF = {
	type:"EOF"
    }
    EOF.next = when(EOF);

    
    var either = function (val) {
	var value = val;
	var leftVal = when.defer();
	var rightVal = when.defer();
	var result;

	var left = function(newValue) {
	    value = newValue;
	    rightVal = when.defer();
	    leftVal.resolve(value);
	    return newValue;
	}

	var right = function(newValue) {
	    value = newValue;
	    leftVal = when.defer();
	    rightVal.resolve(value);
	    return value;
	}


	result = {
	    read: {
		left: function() {return leftVal.promise},
		right: function() {return rightVal.promise}
	    },
	    left:left,
	    right:right
	}
	
	if(val) {
	    return left(val);
	}

	return result;
    }

    var optional = function(adapted) {
	var result = adapted || either();
	result.set = result.left;
	result.clear = result.right;
	result.read.present = result.read.left;
	result.read.absent = result.read.right;
	return result;
    }

    var whenever = function(dependency) {
	var result = optional();
	var left;
	var rightHandler, leftHandler;
	var getRight = function () {
	    return rightHandler;
	}
	var getLeft = function() {
	    return leftHandler;
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

	var right = function(handler) {
	    rightHandler = handler;
	    return swap(dependency.right, handler, result.right, left, getLeft)
	}

	result.read.otherwise = right;

	left = function(handler) {
	    leftHandler = handler;
	    return swap(dependency.left, handler, result.left, right, getRight)
	}

	return  {
	    then: left,
	    otherwise: right
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
	var rejected = stream();
	var doMatch = condition;
	if((typeof condition) != "function") {
	    doMatch = function(val) {
		var match = condition.exec(val)
		return match && (match.length > 1 ? match.slice(1) : match[0])
	    }
	}

	iterate(next, function(val) {
	    var match = doMatch(val)
	    if(match) {
		passed.push(match) 
	    }
	    else {
		rejected.push(val);
	    }
	});
	return {
	    read: {
		next: passed.read.next,
		unmatched: rejected.read.next
	    }
	};
    }

    var eitherStream = function(left, right) {
	var leftIn = left;
	var rightIn = right;

	var currentStream = stream();
	var out = either();
	out.left(currentStream.read.next());
	var currentSource = left;

	var pushTo = function(source, target) {
	    return function (val) {
		if(currentSource !== source) {
		    currentStream.close()
		    currentSource = source;
		    currentStream = stream();
		    target(currentStream.read.next());
		}
		currentStream.push(val)
	    }
	}

	iterate(leftIn, pushTo(leftIn, out.left));
	iterate(rightIn, pushTo(rightIn, out.right));
	

	return {
	    read: out.read
	}
    }

    return {
	either: either,
	optional: optional,
	whenever: whenever,
	stream: stream,
	queue: queue,
	filter: filter,
	iterate: iterate,
	eitherStream: eitherStream,
	EOF: EOF
    }
})
