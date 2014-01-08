var cl = require('craigslist-utils');
var g2z = require('Gps2zip');

var cities = cl.all_cities("US");

function get_coordinates(next, city, sub_city) { 
    function n(posts) {
	next(posts.map(function(p) {
	    if (!p.coords) { return false; }
	    var r = g2z.gps2zip(p.coords.latitude, p.coords.longitude);
	    if (r.error) { return false; }
	    return r['zip code']; })
	    .filter(function(x) { return x; })); }
    cl.get_posts(n, city, "apa", sub_city); }

get_coordinates(console.log, "seattle");
	
