(function(){
    var basics = require('./phloem-spec');
    function run(nodeRunner){
        nodeRunner.run(basics);
    }

    module.exports = run( require('tattler/js/node-runner'));
})();
