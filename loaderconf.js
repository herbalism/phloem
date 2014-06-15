curl({
    baseUrl: '.',

    paths: {
	'phloem' : 'phloem',
        'q' : 'modules/when/when'
    },
    packages: {
        'cons' : {
            'location':'node_modules/consjs',
            'main':'cons'
        },
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

