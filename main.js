var cl = require('craigslist-utils');
var g2z = require('Gps2zip');

var cities = cl.all_cities("US");
var zips = {};

function get_zips(city, sub_city, next) { 
    function n(posts) {
	next(posts.map(function(p) {
	    if (!p.coords) { return false; }
	    var r = g2z.gps2zip(p.coords.latitude, p.coords.longitude);
	    if (r.error) { return false; }
	    return r['zip code']; })
	    .filter(function(x) { return x; })); }
    cl.get_posts(n, city, "apa", sub_city); }

function associate_zips(city, sub_city, next) {
    get_zips(city, sub_city,
	     function(zips) {
		 zips.map(function(z) {
		     zips[z] = zips[z] || [];
		     zips[z].push([city, sub_city]); }); 
	     next(); }); }

function get_all_location_combos() {
    var combos = [];
    for (var c in cities) {
	var city = cities[c];
	if (city.areas.length == 0) {
	    combos.push([city.subdomain, false]); }
	else {
	    for (var a in city.areas) {
		combos.push([city.subdomain, city.areas[a].path]); }}}
    return combos; }

var fns = get_all_location_combos().map(function(x) {
    return {fn: associate_zips, args: x};});

fns.push({fn: function() {console.log(zips); }, args: []});

function call_next_in_chain() {
    if (fns.length == 0) {
	return; }

    var fn = fns.shift();
    fn.args.push(call_next_in_chain);
    fn.fn.apply(false, fn.args); }

call_next_in_chain();
	
	
