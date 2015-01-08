define(['herb-foliage', 'phloem', 'consjs', 'consjs/fn'], function(f, p, consjs) {
    return p.scope(
        function(){
            var stream1 = consjs.stream();
            var stream2 = consjs.stream();
            var i = 0;
            return f.div(
                f.div(
                    p.bind(
                        stream1.read,
                        function(value){
                            return f.p(value.message);
                        },
                        {message: 'press  the button'}),
                    p.bind(
                        stream2.read,
                        function(value){
                            return f.p(value.message);
                        },
                        {message: 'press the other button'})
                ),
                
                f.button("The button",
                         {onClick: function(event){
                             stream1.push({message:i = i + 1})
                         }}
                        ),
                f.button("The other button",
                         {onClick: function(event){
                             stream2.push({message:"a " + (i = i - 1)})
                         }}
                        )
            )
        });
});
