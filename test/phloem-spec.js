(function (){
    function specs(spec, p, f, on, dom, consjs, consfn, q, _) {
        function yield(value) {
            return delay(1, value);
        };

        function withContext(callback) {
            return function() {
                return callback(dom);
            };
        }
        
        var assert = spec.assert;

        var scope = spec("scope",
                         {
                             "returned element gets displayed" : withContext(function(ctx){
                                 var result = f.div(p.scope(
                                     function() {
                                         var message = "hello " + "world";
                                         return f.p("#somep", message);
                                     }
                                 ))(ctx);
                                 return assert.equals(ctx.text(ctx.find(result, "div #somep")).trim(), "hello world");
                             })
                         });

        var bind = spec("bind").
            preconditions(
                function getDom(){return dom;}
            )(
                {
                    "no value no initial" : function(ctx){
                        var stream = consfn.forArray([]);
                        var result = f.div(p.bind(stream, f.p, "initial"))(ctx);
                        return assert.equals(ctx.text(ctx.find(result, "div p")).trim(), "initial");
                    },
                    "creates element from pushed value" : function(ctx){
                        var stream = consfn.forArray(['first value']);
                        var result = f.div(p.bind(stream, f.p, "initial"))(ctx);

                        return q(stream.next()).then(function(value){
                            return assert.equals(
                                ctx.text(ctx.find(result, "div p")).trim(),
                                consjs.value(value));
                        });
                    },
                    "keeps only last pushed value" : function(ctx){
                        var stream = consjs.stream();
                        var result = f.div(p.bind(stream.read, f.p))(ctx);
                        var next = stream.read.next();
                        stream.push('first');
                        return q(next).then(function(value){
                            var paraText = ctx.text(ctx.find(result, "div p")).trim();
                            return assert.equals(paraText, consjs.value(value)).
                                then(function(){ stream.push("second");}).
                                then(function(){return consjs.next(value)});
                        }).then(
                            function(value) {
                                var paraText = ctx.text(ctx.find(result, "div p")).trim();
                                return assert.equals(paraText, consjs.value(value))
                            }
                        );
                    }
                });

        var collectData = spec("collectData", {
            "generates UI for initial state" : withContext(function(ctx){
                var result = f.div(
                    p.collectData(
                        function(context, current) {
                            return f.input('#name', {value:current.name});
                        },
                        {name: 'Bob'}
                    ))(ctx);
                return assert.equals(ctx.find(result, "div #name").attr.value, 'Bob');
            }),
            "change events updates state" : withContext(function(ctx){
                var peekContext = {};
                var result = f.div(
                    p.collectData(
                        function(context, current) {
                            peekContext = context;
                            return f.input(
                                '#name',
                                {
                                    value:current.name,
                                    classes:(current.name === 'Bob' ? 'bobish' : 'unbobish')
                                },
                                context.attach('name')
                            );
                        },
                        {name: 'Bob'})
                )(ctx);

                var input = ctx.find(result, "div #name");
                ctx.trigger(input, 'change', {target:{value:'unbobish'}});
                //wait for update
                return  q(peekContext.states.next()).then(function(){
                    var inputAfterTrigger = ctx.find(result, "div #name");
                    return q.all(
                        assert.equals(inputAfterTrigger.attr.class, 'unbobish'),
                        assert.equals(inputAfterTrigger.attr.value, 'Not Bob'))
                });
            }),
	    "can push value to update state" : withContext(function(ctx){
                var peekContext = {};
                var result = f.div(
                    p.collectData(
                        function(context, current) {
                            peekContext = context;
                            return f.div(
				f.button(
                                    '#act',
				    on('Click', function() {
					context.push('name', 'Alice');
				    })
				),
				f.input(
				    '#name',
				    {
					value:current.name,
					classes:(current.name === 'Bob' ? 'bobish' : 'unbobish')
				    }
				));
                            },
                            {name: 'Bob'})
                )(ctx);

                var input = ctx.find(result, "div div #act");
                ctx.trigger(input, 'click', {});
                //wait for update
                return  q(peekContext.states.next()).then(function(){
                    var inputAfterTrigger = ctx.find(result, "div div #name");
                    return q.all(
                        assert.equals(inputAfterTrigger.attr.class, 'unbobish'),
                        assert.equals(inputAfterTrigger.attr.value, 'Not Bob'))
                });
	    })
        });
        
        return [scope, bind, collectData];
    }
    if (typeof define !== 'undefined') {
        define(['tattler/spec', 
                'phloem', 
                'herb-foliage',
                'herb-foliage/foliage-event',
                'herb-foliage/foliage-dom',
                'consjs',
                'consjs/fn',
                'q',
                'lodash'], specs);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = specs(
            require('tattler/js/tattler-spec'), 
            require('../phloem'),
            require('herb-foliage'), 
            require('herb-foliage/foliage-event'), 
            require('herb-foliage/foliage-dom'), 
            require('consjs'),
            require('consjs/fn'),
            require('q'),
            require('lodash'));
    }
})()
