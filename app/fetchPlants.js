// Save this as fetchPlants.js
const http = require('https');

const options = {
    method: 'GET',
    hostname: 'house-plants2.p.rapidapi.com',
    port: null,
    path: '/search?query=Fern',
    headers: {
		'x-rapidapi-key': 'b9ebff498emsh6935a48ba87760cp168c0bjsnc36ced2d3ae8',
        'x-rapidapi-host': 'house-plants2.p.rapidapi.com'
    }
};

const req = http.request(options, function (res) {
    const chunks = [];

    res.on('data', function (chunk) {
        chunks.push(chunk);
    });

    res.on('end', function () {
        const body = Buffer.concat(chunks);
        console.log(body.toString());
    });
});

req.end();