import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'
import share from './lib/share'
import d3 from 'd3'
import topojson from 'topojson'
//import euroMap from './mapData/subunitsEuroOpt.json!json'

import euroMap from './mapData/euro.json!json'


var shareFn = share('Interactive title', 'http://gu.com/p/URL', '#Interactive');

export function init(el, context, config, mediator) {
    el.innerHTML = mainHTML.replace(/%assetPath%/g, config.assetPath);

    reqwest({
        url: 'https://interactive.guim.co.uk/docsdata/1JgiILez8GTw9H5YvOolaziq17hnjKkbdoBG802oRpng.json',
        type: 'json',
        crossOrigin: true,
        success: (resp) => initData(resp)
    });

    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });
}

function initData(resp){
    console.log(resp)
    el.querySelector('.test-msg').innerHTML = `Loaded`
        var width = 960,
        height = 480;
    var projection = d3.geo.mercator()
        .center([20, 50])
        .rotate([4.4, 0])
        .scale(1200 * 0.4)
        .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);    

    var svg = d3.select("#mapHolder").append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll(".subunit")
      .data(topojson.feature(euroMap, euroMap.objects.subunits).features)
    .enter().append("path")
      .attr("class", function(d) { var elClass = "none-europe ";var elCont = d.properties.continent; if(elCont == "Europe"){ elClass = "europe" }; return elClass; }) // + d.id
      .attr("id", function(d){ return "shp_"+d.properties.name})
      .attr("d", path);    

    // svg.append("path")
    //     .datum(topojson.feature(euroMap, euroMap.objects.subunits))
    //     .attr("d", path);
        
}
