(function(){
    function phloem(consjs, fn, f, when) {
        function doNext(iter, ui, parent, undo) {
	    return when(iter).then(function(model) {
	        var last = ui(consjs.value(model))(parent);
	        undo.undo = last.undo;
	        when(consjs.next(model)).then(last.undo);
	        return doNext(consjs.next(model), ui, parent, undo);
	    });
        }

        function bind (stream, elementFactory, initial) {
            return function(dom) {
                var update = dom.dynamic(elementFactory, initial);
                fn.each(stream,
                        function(value){
                            update.next(value);
                        });
                return update.element;
            }
        }

        function scope(s) {
            return s();
        }
        
        var res = {
            scope: scope,
            bind: bind,
            collectData:function(fn, initial){
                return scope(function() {
                    var stateChanges = consjs.stream();
                    var current = initial;
                    var context = {
                        states: stateChanges.read,
                        attach: function(name) {
                            return {
                                onChange: function(event) {
                                    current[name]=event.target.value;
                                    stateChanges.push(current);
                                }
                            }
                        }
                    };
                    return bind(
                        stateChanges.read,
                        function(newState){
                            current = newState;
                            return fn(context, newState);
                        },
                        initial);
                })}
        }
        return res;
    }
    if (typeof define !== 'undefined') {
        define(['consjs', 
                'consjs/fn',
                'herb-foliage',
                'q'], phloem);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = phloem(
            require('consjs'), 
            require('consjs/fn'),
            require('herb-foliage'), 
            require('q'));
    }
})();
