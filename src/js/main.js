import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'

import d3 from 'd3'

import lodash from 'lodash'
import topojson from 'topojson'
import d3Slider from './lib/d3Slider'
import euroMap from './mapData/subunits.json!json'
import moment from 'moment'
import twix from 'twix'
import 'moment/locale/en-gb';

import share from './lib/share'
//import addD3AreaChart from './lib/addD3AreaChart'
moment.locale('en-gb') //console.log(moment.locale())

var _ = lodash;
var shareFn = share('Interactive title', 'http://gu.com/p/URL', '#Interactive');
var electionData, electionDataByCountry, euCountries, euJoinData, startDate, endDate;


export function init(el, context, config, mediator) {

    el.innerHTML = mainHTML.replace(/%assetPath%/g, config.assetPath);
    
    reqwest({
        url: 'https://interactive.guim.co.uk/docsdata/1JgiILez8GTw9H5YvOolaziq17hnjKkbdoBG802oRpng.json',
        type: 'json',
        crossOrigin: true,
        success: (resp) => modelData(resp)
    });

    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });

}

function modelData(resp){
    electionData = resp.sheets["ElectionsByCountry]"];  // data entered with "]" at end of value
    euJoinData = resp.sheets.DateJoinedEU;
    euCountries = []
    _.forEach(euJoinData, function(item, i) {
        var DateFormat = new Date(manualDateFormat(item.JoinedDate)); 
        item.DateFormat = DateFormat
        item.compDate = moment(DateFormat).format("YYYYMMDD");
        item.unixFormat =  (DateFormat.getTime() / 1000).toFixed(0)
        item.Country = item["Country "];
        var newObj = {}
        newObj.Country = item["Country "];
        euCountries.push(newObj);
     })  

     _.forEach(electionData, function(item, i) {
         var DateFormat = new Date(manualDateFormat(item.DateCameToPower))   
         item.DateFormat = DateFormat;   //MM-DD-YYYY
         item.compDate = moment(DateFormat).format("YYYYMMDD")
         item.unixFormat =  (item.DateFormat.getTime() / 1000).toFixed(0)
         item.Country = formatStr(item.Country)
     
     }) 

    electionDataByCountry = _.groupBy(electionData, function(item) { return item.Country});

    buildView()  
}


function buildView(){
        addD3Map(); 
    
}


function setTimeLineData(){
    startDate = euJoinData[0]["compDate"];
    endDate  = electionData[0]["compDate"];
        _.forEach(euJoinData, function(item, i) {
            if (startDate > item.compDate){ startDate = item.compDate;};
            

        }); 
        _.forEach(electionData, function(item, i) {

            if (endDate < item.compDate){ endDate =  item.compDate};
                //console.log(moment(item.DateFormat).format('MM-DD-YYYY'))
                //console.log( item )//item.Country+"---------"+moment(item.DateFormat).format('MM-DD-YYYY') 
        });

   // addD3Slider(startDate, endDate);
    getDatesRangeArray(startDate, endDate);

}


var getDatesRangeArray = function (startDate, endDate) {
    
    //console.log(startDate, endDate)   (moment(endDate).format("MM-DD-YYYY"))

    var itr = moment.twix(startDate, endDate).iterate(4, 'weeks');
    var range=[];
    
    while(itr.hasNext()){
        range.push(itr.next().format("MM-DD-YYYY"))
    }

    var graphDTemp = getGraphData(range);

    addD3AreaChart(graphDTemp)

}



function getGraphData(range){

    var tempGraphData = [];

        _.forEach(range, function(item, key){ // look for each month on the timeline

            var checkDate =  moment(item).format("YYYYMMDD"); 
            var newObj={};
            var tempArr = [];
            newObj.compDate = checkDate; // adding a legible date 

                    _.forEach(electionDataByCountry, function(CountryElections){
                        
                         var tempObj = {};
                        
                            _.forEach(CountryElections, function(election){
                                // continue here
                                
                                if (checkDate > election.compDate){  tempObj.lr = election.leftorright; tempObj.Country=election.Country }
                            })

                        tempArr.push(tempObj)  

                    });
            newObj.lrArr = tempArr;        
            tempGraphData.push(newObj)        
                // set the last date vars and push to outputArr    
                //tempGraphData.push(newObj)

        });
    
    _.forEach(tempGraphData, function(item){
        var lrVal = 0;

            _.forEach(item.lrArr, function(o){

                    if (o.lr == "L"){ lrVal=lrVal-1 }
                    if (o.lr == "R"){ lrVal=lrVal+1 }
            })

        item.lrCount = lrVal;    
        

    })

    return tempGraphData;

}


function addD3Map(){
    var emptyDiv = document.getElementById('mapHolder');
    emptyDiv.innerHTML = " ";

    var margin = {top:0, right:0, bottom:0, left:220 }
    
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
        .attr("width", width - margin.left)
        .attr("height", height);

    svg.selectAll(".subunit")
        .data(topojson.feature(euroMap, euroMap.objects.subunits).features)

    .enter().append("path")
        .attr("class", function(d) { var elClass = "none-europe "; if (d.properties.continent == "Europe"){ elClass = "europe" }; return elClass; }) // + d.id
        .attr("id", function(d){  return "shp_"+ formatStr(d.properties.name) }) //console.log(d);
        .attr("d", path); 

        setTimeLineData();
}

function addD3Slider(minDate,maxDate){
    var sliderDiv = document.getElementById('slider3');
    sliderDiv.innerHTML = " ";
    // var minDateUnix = moment('2014-07-01', "YYYY MM DD").unix();
    // var maxDateUnix = moment('2015-07-21', "YYYY MM DD").unix();
    var timeValue = 28; //set to 28 days

        d3.select('#slider3').call(d3Slider()
          .axis(true)
            .min(minDate)
            .max(maxDate)
            .step(timeValue)

          .on("slide", function(evt, value) {
            upDateMapView(value)
           //console.log(value)
          })
        );
}

function upDateMapView(n){

console.log(n)
    _.forEach(electionDataByCountry, function(item, key) {
        _.forEach(item, function(obj){
                if(obj.compDate < n){
                    item.govNow = obj.leftorright;
                }
        })
    }) 

    upDateCountries();

}


function upDateCountries(){
    var countries = d3.select("svg").selectAll(".europe");

    _.forEach(electionDataByCountry, function(item, key) {
         var currClipArr = getCurrClipArr(key);
                _.forEach(currClipArr, function(o){
                    updateCountryClass(d3.select(o), item.govNow);  
                })
         
    } );   
 }


function getCurrClipArr(s){
    //console.log(s)
    var a = [];
    if ( s != "Germany"){ a.push("#shp_"+s) }
    //if (s != "Belgium" && s != "UK" && s != "Germany" ){  }
    if (s == "Germany"){ a = [ ];  a.push("#shp_West-Germany"); a.push("#shp_East-Germany"); }
    //if (s == "Belgium"){  var a = [ ];  a.push("#shp_Walloon"); a.push("#shp_Flemish");  a.push("#shp_Brussels") }
    //if (s == "UK"){  var a = [ ]; a.push("#shp_N--Ireland") ; a.push("#shp_Scotland"); a.push("#shp_Wales"); a.push("#shp_England") }
    // console.log(a)   
    return a;
}


function updateCountryClass(c,s){
    var newClass;

    if (s == "L"){ newClass = "europe left-wing"}
    if (s == "R"){ newClass = "europe right-wing" }
    if (s == "totalitarian"){ newClass = "europe totalitarian" }
    if (s == "Coalition"){ newClass = "europe coalition"  }
    if (s == "coalition"){ newClass = "europe coalition"  }    

    c.attr("class", function(){ return newClass });
}

function formatStr(s){
    s = s.replace(/\./g, '-');
    s = s.replace(/\s/g, '-');

    return s;
}

function manualDateFormat(s){
    var a = s.split("/"); 
    s = a[1]+"-"+a[0]+"-"+a[2]

    return(s) 
}

function addD3AreaChart(data){

        var targetDiv = document.getElementById('areaChartHolder');
            targetDiv.innerHTML = " ";
   
        var margin = {top: 0, right: 20, bottom: 0, left: 50},
            width = 240 - margin.left - margin.right,
            height = 480 - margin.top - margin.bottom;

        var parseDate = d3.time.format("%Y%m%d").parse;

        var y = d3.time.scale()
            .range([0, height]);

        var x = d3.scale.linear()
            .range([width, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize(-height)
            .tickPadding(6);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(-width)
            .tickPadding(6);

        var line = d3.svg.line()
            .interpolate("basis")
            .x(function(d) { return x(d.temperature); })
            .y(function(d) { return y(d.date); });

        var svg = d3.select(targetDiv).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)

          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        
         data.forEach(function(d) {
            d.date = parseDate(d.compDate);
            d.msec = d.date.getTime()
            d.temperature = + d.lrCount;
          });

        var start = data[0].date; 
        var step = 1000 * 60 * 60 * 24 * 28; // 4 weeks

        var startMsec = start.getTime();
        var CurrentDate = new Date(1958, 0, 1);
        var tempDate;
        var stepMsec;
        var tempMsec;

        var offsets = data.map(function(t, i) { return [Date.UTC(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), t.temperature, t]; });

          x.domain([d3.max(data, function(d) { return d.temperature; }), -16]);
          y.domain([data[data.length - 1].msec, data[0].msec]);

          svg.append("linearGradient")
              .attr("id", "temperature-gradient")
              .attr("gradientUnits", "userSpaceOnUse")
              .attr("x1", -16).attr("y1", y(0))
              .attr("x2", 16).attr("y2", y(0))

            .selectAll("stop")
              .data([
                {offset: "0%", color: "red"},
                {offset: "50%", color: "orange"},
                {offset: "100%", color: "navy"}
              ])

            .enter().append("stop")
              .attr("offset", function(d) { return d.offset; })
              .attr("stop-color", function(d) { return d.color; });

          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

          svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text("Date");

          svg.append("path")
              .datum(data)
              .attr("class", "line")
              .attr("d", line);

          var infobox = svg.append("g")
              .attr("class", "infobox")
              .attr("id", "infoBox");

              infobox.append("rect")
              .attr("width", width)
              .attr("x",-10)
              .attr("height", 20);

            var focus = svg.append("g")
              .attr("class", "focus");

              focus.append("rect")
              .attr("width", width)
              .attr("x",-10)
              .attr("height", 20);

              focus.append("line")
              .attr("x1", width)
              .attr("x2", 0);

              focus.append("circle")
              .attr("r", 5);

              infobox.append("text")
              .attr("x", -6)
              .attr("y", -9);

            svg.append("rect")
              .attr("class", "svg-overlay")
              .attr("id", "svgOverlay")
              .attr("width", width)
              .attr("height", height)
              .on("mousemove", mousemove);
              //.call(drag);
              //


function mousemove() {  
          stopPropagation()
          var d = Math.round(y.invert(d3.mouse(this)[1]));
          var obj = offsets[Math.round((d-start)/step)];

          focus.select("line").attr("transform", "translate( 0 ,"+ d3.mouse(this)[1] +" )");
          focus.select("circle").attr("transform", "translate( "+ x(obj[1])  +" , "+ d3.mouse(this)[1] +" )");
          //focus.select(".x").attr("transform", "translate(" + x(d[0]) + ",0)");
          //focus.select(".y").attr("transform", "translate(0," + y(d[1]) + ")");
          svg.selectAll(".x.axis path").style("fill-opacity", Math.random()); // XXX Chrome redraw bug

          upDateMapView(obj[2].compDate)

        }

      function stopPropagation() {
        d3.event.stopPropagation();
      }

      
}


