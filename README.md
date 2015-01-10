Phloem
==========
*In vascular plants, phloem is the living tissue that carries organic nutrients, particularly sucrose, a sugar, to all parts of the plant where needed*

Phloem uses connects consjs streams to userinterfaces created with phloem [herbalism framework](http://github.com/herbalism).

User interface functions
------------------------
**scope** scope is used to save instance specific data in an element. 

```JavaScript
p.scope(fn);
```

It is possible to create foliage elements that can be used many times.
In order to keep state separate from each usage store it with scope.

```JavaScript
var globalVariable = 0;

p.scope(function(){
    var variableForThisInstance = (globalVariable = globalVariable + 1);
    return f.p("The value for this instance is ", valueforThisInsance);
});
```
**bind** is used to bind data from a stream to a position in a UI.

```JavaScript
p.bind(stream, fn, initial);
```

The first value passed to *fn* is initial. After that each value from *stream* will be past to *fn* in sequence.

*fn* should return a foliage compatible element.

```JavaScript
p.bind(someStream, function(value){return f.p(value.name);}, {name: 'no name given'});
```
**collectData** is used to incrementally collect data. Intended for use in incrementally validating forms.

```JavaScript
p.collectData(fn, initial);
```

*fn* is passed a *context* and a *value* starting with *initial*. 
The context is used to connect input fields to the collected dataset.
For each change a new value will be presented and the form will be rerendered to present the new state.

Fn should present a valid *foliage* element after each iteration.

```JavaScript
function validateName(name) {
   return name && (name.length > 4);
};

p.collectData(
  function(context, value) {
    return f.form(
        f.input(
           {name: 'name',
            value: value.name,
            placeholder: 'name',
            classes: validateName(value.name) ? ['valid'] : ['invalid']
            },
           context.attach('name')
        ),
        f.input(
           {type: 'submit',
            onSubmit: function(event){
               event.preventDefault();
               event.stopPropagation();
               resultStream.push(value);
            }},
            validateName(name) ? {} : {disabled:'disabled'}
        )
    )
  },
  {name:'default name'}
)
```
