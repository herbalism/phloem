(function(){
    function phloem(phloem, fn, f, when) {
        function doNext(iter, ui, parent, undo) {
	    return when(iter).then(function(model) {
	        var last = ui(phloem.value(model))(parent);
	        undo.undo = last.undo;
	        when(phloem.next(model)).then(last.undo);
	        return doNext(phloem.next(model), ui, parent, undo);
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

        var res = {
            scope: function(s) {
                return s();
            },
            bind: bind
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
