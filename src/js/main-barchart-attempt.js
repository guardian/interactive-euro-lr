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

    var itr = moment.twix(startDate, endDate).iterate(91, 'days');
    var range=[];
    
    while(itr.hasNext()){
        range.push(itr.next().format("MM-DD-YYYY"))
    }

    var graphDTemp = getGraphData(range);

    console.log(graphDTemp)

    addD3AreaChart(graphDTemp)

}


function getMemberStatus(election){


      _.forEach(euJoinData, function(item){
          
          if (item.Country == election.Country && election.compDate > item.compDate){ console.log("work here"); return "true" } else { return "false" }

      })
}


function getGraphData(range){
    var format = d3.time.format("%m/%d/%Y");
    var tempGraphData = [];

        _.forEach(range, function(item, key){ // look for each month on the timeline

           var checkDate =  moment(item).format("YYYYMMDD"); 
            var d3Date =  moment(item).format("D-MMM-Y");
            var newObj={};
            var tempArr = [];
            newObj.compDate = checkDate; // adding a legible date 
            newObj.date = d3Date;

                    _.forEach(electionDataByCountry, function(CountryElections){
                        
                         var tempObj = {};
                        
                            _.forEach(CountryElections, function(election){                                                              
                                if (checkDate > election.compDate){  
                                  tempObj.lr = election.leftorright; 
                                  tempObj.Country=election.Country; 
                                  tempObj.euMember=getMemberStatus(election) 
                                }
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
        item.close = rightValue;
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
    var timeValue = 91; //set to 13 weeks - closest possible constant to a quarter 

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

 function upDateTexts(d){

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

function addD3AreaChart(data){

        var barSize = 3;
        var barPad = 1;
        var barHeight = barPad+barSize;        

        var margin = {top: 0, right: 10, bottom: 36, left: 24},
          width = 140 ,//- margin.left - margin.right
          height = data.length  * barHeight;

        var parseDate = d3.time.format("%d-%b-%Y").parse;

        var x = d3.scale.linear()
            .range([0, width ]);

        var y = d3.time.scale()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(-(height-margin.top-margin.bottom-100), 0, 0); 

        var svg = d3.select("#areaChartHolder").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        data.forEach(function(d,k) {
          console.log(k)
          d.date = parseDate(d.date);

        });

        y.domain(d3.extent(data, function(d) { return d.date; }));
        x.domain([-20, d3.max(data, function(d) { return d.close; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate( 0 ," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

      var unitWidth = width/42;
        svg.append("rect")
              .attr("class", "svg-bg")
              .attr("width", width)
              .attr("height", height)

      var barCount = 0;     
              
      var bar = svg.selectAll("g")
            .data(data)
          .enter().append("g")
          .attr("transform", function(d,k) { return "translate( 0 ,"+ (height - (k * barHeight)) +")"; }); // barCount++; console.log("bar ",barCount, d.date);
            
        bar.append("rect")
              .attr("class","area-left")
              .attr("width", function(d){ return unitWidth * d.leftValue })
              .attr("height", barSize)
              .attr("transform", function(d){ return "translate("+((width/2)-(unitWidth * d.leftValue))+",0)" } );

        bar.append("rect")
              .data(data)
              .attr("class","area-right")
              .attr("width", function(d){ return unitWidth * d.rightValue })
              .attr("height", barSize)
              .attr("transform", function(d){ return "translate("+(width/2)+",0)" } );       

        // var barR = svg.selectAll("g")
        //     .data(data)
        //   .enter().append("g")
        //     .attr("transform", function(d, key) { return "translate("+ (width/2) +","+ (key * barHeight) +")"; });

        // bar.append("rect")
        //       .data(data)
        //       .attr("class","area-right")
        //       .attr("width", function(d){ return unitWidth * d.rightValue })
        //       .attr("height", barSize);  

        // .append("text")
        //   .attr("transform", "rotate(-90)")
        //   .attr("y", "200")
        //   .attr("dy", "240")
        //   .style("text-anchor", "end")
        //   .text(" ");

          var focus = svg.append("g")
              .attr("class", "focus");
              
              focus.append("line")
              .attr("x1", width)
              .attr("x2", 0);

              focus.append("circle")
              .attr("r", 5);

            svg.append("rect")
              .attr("class", "svg-overlay")
              .attr("id", "svgOverlay")
              .attr("width", width)
              .attr("height", height)
              .on("mousemove", mousemove);

              console.log(d3.select('.svg-overlay'))
              //.call(drag);
              //
var start = data[0].date; 
var step = 1000 * 60 * 60 * 24 * 91; // millsec*second*min*hour*days required (91 days - approx a quarter of year)
var offsets = data.map(function(t, i) { return [Date.UTC(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), t.lrCount, t]; });

console.log(offsets.length)

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
          upDateTexts(obj[2])

        }

      function stopPropagation() {
          d3.event.stopPropagation();
      }  

      
}


