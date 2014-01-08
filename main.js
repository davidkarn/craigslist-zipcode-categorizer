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
	     function(found_zips) {
		 found_zips.map(function(z) {
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

function build_zips_cities_list() {
    zips = {};
    var fns = get_all_location_combos().map(function(x) {
	return {fn: associate_zips, args: x};});

    fns.push({fn: function() {
	require('fs')
	    .writeFile('zips_cities.js', 
		       "exports.zips_cities = " + JSON.stringify(zips) + ";"); }, 
	      args: []});

    function call_next_in_chain() {
	if (fns.length == 0) {
	    return; }

	var fn = fns.shift();
	fn.args.push(call_next_in_chain);
	fn.fn.apply(false, fn.args); }

    call_next_in_chain(); }

function tally_and_select(hits) {
    if (!hits || hits.length == 0) { return false; }
    var tallies = {};
    for (var i in hits) {
	if (!tallies[hits[i]]) {
	    tallies[hits[i]] = 0; }
	tallies[hits[i]] += 1; }
    var max = false, maxvalue = 0;
    for (var i in tallies) {
	if (tallies[i] > maxvalue) {
	    maxvalue = tallies[i];
	    max = unhash(i); }}
    return max; }

function unhash(str) {
    var r = str.split(',');
    if (r[1] == 'false') {
	r[1] = false; }
    return r; }

function match_zips() {
    var zip_codes = JSON.parse(require('fs').readFileSync('zips.json', 'ascii'));
    var zip_cities = require('./zips_cities').zips_cities;
    var zips = {};
    for (var i in zip_codes) {
	var zip = zip_codes[i]['zip code'];
	zips[zip] = tally_and_select(zip_cities[zip]); } 
    console.log(zips); }



match_zips();
	
