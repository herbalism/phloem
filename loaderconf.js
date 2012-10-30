curl({
    baseUrl: '.',

    paths: {
	'phloem' : 'src/phloem'
    },
    packages: {
        'when' : {
            'location': 'modules/when',
            'main': 'when'
        }
    }
});
window.require = curl;
