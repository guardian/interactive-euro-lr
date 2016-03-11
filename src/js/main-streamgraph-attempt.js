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
    buildView();
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


    addD3Chart(graphDTemp,"blue")

}



function getGraphData(range){

    var tempGraphData = [];

        _.forEach(range, function(item, key){ // look for each month on the timeline
            
            var checkDate =  moment(item).format("YYYYMMDD"); 
            var d3Date =  moment(item).format("M/D/Y");
            var newObj={};
            var tempArr = [];
            newObj.compDate = checkDate; // adding a legible date 
            newObj.d3Date = d3Date;
                    _.forEach(electionDataByCountry, function(CountryElections){
                        
                         var tempObj = {};
                        
                            _.forEach(CountryElections, function(election){
                                
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
        var leftValue = 0;
        var rightValue = 0;

            _.forEach(item.lrArr, function(o){

                    if (o.lr == "L"){ lrVal=lrVal-1; leftValue++ }
                    if (o.lr == "R"){ lrVal=lrVal+1; rightValue++  }
            })

        item.leftValue = leftValue;  
        item.rightValue = rightValue; 
        item.lrCount = lrVal;   
        

    })

    return tempGraphData;

}


function addD3Map(){
    var emptyDiv = document.getElementById('mapHolder');
    emptyDiv.innerHTML = " ";

    var margin = {top:0, right:0, bottom:0, left:220 }
    
    var width = 960,
        height = 640;

    //var center = d3.geo.centroid(json);    

    var projection = d3.geo.mercator()
        .center([20, 50])
        .rotate([4.4, 0])
        .scale(1200 * 0.7)

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
         
    });   
 }

 function upDateTexts(d){
    console.log(d);

    var dateHolder = document.getElementById("dateHolder");

    dateHolder.innerHTML = moment(d.compDate).format('LL')

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


;

function addD3Chart(data, color) {
  var datearray = [];
  var colorrange = [];

      if (color == "blue") {
        colorrange = ["#045A8D", "#2B8CBE", "#74A9CF", "#A6BDDB", "#D0D1E6", "#F1EEF6"];
      }

      else if (color == "pink") {
        colorrange = ["#980043", "#DD1C77", "#DF65B0", "#C994C7", "#D4B9DA", "#F1EEF6"];
      }

      else if (color == "orange") {
        colorrange = ["#B30000", "#E34A33", "#FC8D59", "#FDBB84", "#FDD49E", "#FEF0D9"];
      }

      var strokecolor = colorrange[0];

      var format = d3.time.format("%m/%d/%Y");

      var margin = {top: 20, right: 40, bottom: 30, left: 30};
      var width = document.body.clientWidth - margin.left - margin.right;
      var height = 400 - margin.top - margin.bottom;

      var tooltip = d3.select("body")
          .append("div")
          .attr("class", "remove")
          .style("position", "absolute")
          .style("z-index", "20")
          .style("visibility", "hidden")
          .style("top", "30px")
          .style("left", "55px");

      var x = d3.time.scale()
          .range([0, width]);

      var y = d3.scale.linear()
          .range([height-10, 0]);

      var z = d3.scale.ordinal()
          .range(colorrange);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(d3.time.weeks);

      var yAxis = d3.svg.axis()
          .scale(y);

      var yAxisr = d3.svg.axis()
          .scale(y);

      var stack = d3.layout.stack()
          .offset("silhouette")
          .values(function(d) { return d.values; })
          .x(function(d) { return d.date; })
          .y(function(d) { return d.value; });

      var nest = d3.nest()
          .key(function(d) { return d.key; });

      var area = d3.svg.area()
          .interpolate("cardinal")
          .x(function(d) { return x(d.date); })
          .y0(function(d) { return y(d.y0); })
          .y1(function(d) { return y(d.y0 + d.y); });

      var svg = d3.select(".chart").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

       _.forEach(data, function (item,i){
            item.date = format.parse(item.d3Date);
            item.value = item.lrCount;
        })    

       graph(data)
      
       function graph(data) {
        
            var layers = stack(nest.entries(data));
                  console.log(data)
                    x.domain(d3.extent(data, function(d) { return d.date; }));
                    y.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);

                    svg.selectAll(".layer")
                        .data(layers)
                      .enter().append("path")
                        .attr("class", "layer")
                        .attr("d", function(d) { return area(d.values); })
                        .style("fill", function(d, i) { return z(i); });


                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(xAxis);

                    svg.append("g")
                        .attr("class", "y axis")
                        .attr("transform", "translate(" + width + ", 0)")
                        .call(yAxis.orient("right"));

                    svg.append("g")
                        .attr("class", "y axis")
                        .call(yAxis.orient("left"));

                    svg.selectAll(".layer")
                      .attr("opacity", 1)
                      .on("mouseover", function(d, i) {
                        svg.selectAll(".layer").transition()
                        .duration(250)
                        .attr("opacity", function(d, j) {
                          return j != i ? 0.6 : 1;
                      })})

                      .on("mousemove", function(d, i) {
                        mousex = d3.mouse(this);
                        mousex = mousex[0];
                        var invertedx = x.invert(mousex);
                        invertedx = invertedx.getMonth() + invertedx.getDate();
                        var selected = (d.values);
                        for (var k = 0; k < selected.length; k++) {
                          datearray[k] = selected[k].date
                          datearray[k] = datearray[k].getMonth() + datearray[k].getDate();
                        }

                        mousedate = datearray.indexOf(invertedx);
                        pro = d.values[mousedate].value;

                        d3.select(this)
                        .classed("hover", true)
                        .attr("stroke", strokecolor)
                        .attr("stroke-width", "0.5px"), 
                        tooltip.html( "<p>" + d.key + "<br>" + pro + "</p>" ).style("visibility", "visible");
                        
                      })
                      .on("mouseout", function(d, i) {
                       svg.selectAll(".layer")
                        .transition()
                        .duration(250)
                        .attr("opacity", "1");
                        d3.select(this)
                        .classed("hover", false)
                        .attr("stroke-width", "0px"), tooltip.html( "<p>" + d.key + "<br>" + pro + "</p>" ).style("visibility", "hidden");
                    })
                      
                    var vertical = d3.select(".area-chart-holder")
                          .append("div")
                          .attr("class", "remove")
                          .style("position", "absolute")
                          .style("z-index", "19")
                          .style("width", "1px")
                          .style("height", "380px")
                          .style("top", "10px")
                          .style("bottom", "30px")
                          .style("left", "0px")
                          .style("background", "#fff");

                    d3.select(".area-chart-holder")
                        .on("mousemove", function(){  
                           mousex = d3.mouse(this);
                           mousex = mousex[0] + 5;
                           vertical.style("left", mousex + "px" )})
                        .on("mouseover", function(){  
                           mousex = d3.mouse(this);
                           mousex = mousex[0] + 5;
                           vertical.style("left", mousex + "px")});
              };

}
