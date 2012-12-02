curl({
    baseUrl: '.',

    paths: {
	'phloem' : 'src/phloem',
    },
    packages: {
        'when' : {
            'location': 'modules/when',
            'main': 'when'
        },
        'lodash' : {
            'location': 'modules/lodash',
            'main': 'lodash'
        }
    }
});
window.require = curl;
