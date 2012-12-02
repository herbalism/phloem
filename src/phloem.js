define (['when', 'lodash'], function(when, _) {
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

    var not = function(either) {
	function swap(val) {
	    var left = val.left;
	    var right = val.right;
	    return {
		left: right,
		right: left
	    }
	}

	var result = swap(either);
	if (either.read) {
	    result = swap(result)
	    result.read = swap(either.read);
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
	var NOOP = function(value) {return value};
	var result = either();

	var rightHandler, leftHandler;
	rightHandler = leftHandler = NOOP;

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

	var left;
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
	var deferredNext = when.defer();
	var nextValue = deferredNext.promise;
	var push = function(value){
	    var old = deferredNext;
	    deferredNext = when.defer();
	    nextValue = old.promise;
	    var result = {value:value, next:deferredNext.promise}
	    return old.resolve(result);
	}

	return {
	    push: push,
	    close: function() {
		nextValue = EOF;
		deferredNext.resolve(EOF);
	    },
	    read: {
		next: function(){
		    return nextValue
		}
	    }
	}
    }

    var queue = function(getId) {
	var getId = getId || function(val) {return val}
	var input = stream();
	var rootQueue = input.read.next()
	var snapshot = [];

	var add = function (snap, element) {
	    var acc = snap.concat([element])
	    acc.added = element;
	    return acc;
	}

	var drop = function (snap, element) {
	    var elemId = getId(element);
	    var acc = snap.filter(function(val){
		return elemId !== getId(val);
	    })

	    acc.dropped = snap.filter(function(val){return elemId === getId(val)});
	    return acc;
	}

	var aggregate = function(snapshot) {
	    return function(element) {
		var acc = snapshot;

		if(element.value.add) {
		    acc = add(snapshot, element.value.add);
		}
		else if (element.value.drop) {
		    acc = drop(snapshot, element.value.drop);
		}
		
		return when(input.read.next()).then(
		    function(nextElement) {
			if(element.next === nextElement.next) {
			    return {value: acc, next: when(element.next).then(aggregate(acc))}
			}
			else {
			    return when(element.next).then(aggregate(acc))
			}
		    })

	    }
	}
	
	return {
	    next: function(){
		return when(rootQueue).then(aggregate(snapshot))
	    },
	    push: function(value) {
		return input.push({add: value});
	    },
	    drop: function(value) {
		return input.push({drop: value});
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

    var events = function(output) {
	var out = output || stream();
	return {
	    push: function(value){out.push({added: _.isArray(value) ? value : [value]})},
	    drop: function(value){out.push({dropped: _.isArray(value) ? value : [value]})},
	    snap: function(value){out.push({snap: _.isArray(value) ? value : [value]})},
	    read: out.read
	}
    }

    var eitherStream = function(left, right) {
	var leftIn = left;
	var rightIn = right;

	var currentStream = stream();
	var out = either();
	out.left(currentStream.read.next);
	var currentSource = left;

	var pushTo = function(source, target) {
	    return function (val) {
		if(currentSource !== source) {
		    currentStream.close()
		    currentSource = source;
		    currentStream = stream();
		    target(currentStream.read.next);
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
	not: not,
	optional: optional,
	whenever: whenever,
	stream: stream,
	events: events,
	queue: queue,
	filter: filter,
	iterate: iterate,
	eitherStream: eitherStream,
	EOF: EOF,
	next: function(val){return val.next},
	value: function(val) {return val.value},
	log: function(val) {console.log(val); return val}
    }
})
