import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'

import d3 from 'd3'

import lodash from 'lodash'
import topojson from 'topojson'
import euroMap from './mapData/subunits.json!json'
import moment from 'moment'
import twix from 'twix'
import 'moment/locale/en-gb';

import share from './lib/share'
import Tooltip from './Tooltip'
import addD3AreaChart from './addD3AreaChart' //implement as…  new addD3AreaChart(graphDTemp, margin);
moment.locale('en-gb') //console.log(moment.locale())

var _ = lodash;
var shareFn = share('Interactive title', 'http://gu.com/p/URL', '#Interactive');

var electionData, electionDataByCountry, euCountries, euJoinData, startDate, endDate, selectedDate;
var margin = {top: 90, right: 20, bottom: 36, left: 20}

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

    euJoinData.sort(function(a, b) {
        return parseFloat(a.compDate) - parseFloat(b.compDate);
    });

    buildView();


}


function buildView(){
        var initObj = { compDate:"19730101"} //hacked in a start date to update text
        addD3Map();
        upDateTexts(initObj)
        
    
}


function setTimeLineData(){
    selectedDate = "19730101";
    startDate = "19730101";
    endDate  = electionData[0]["compDate"];
        _.forEach(euJoinData, function(item, i) {
            //if (startDate > item.compDate){ startDate = item.compDate;};
        }); 
        _.forEach(electionData, function(item, i) {

            if (endDate < item.compDate){ endDate =  item.compDate};
                //console.log(moment(item.DateFormat).format('MM-DD-YYYY'))
                //console.log( item )//item.Country+"---------"+moment(item.DateFormat).format('MM-DD-YYYY') 
        });

    getDatesRangeArray(startDate, endDate);
    upDateTexts(euJoinData[0])

}


var getDatesRangeArray = function (startDate, endDate) {
    var itr = moment.twix(startDate, endDate).iterate(13, 'weeks');
    var range=[];
    
    while(itr.hasNext()){
        range.push(itr.next().format("MM-DD-YYYY"))
    }

    var graphDTemp = getGraphData(range);

    new addD3AreaChart(graphDTemp, margin, electionDataByCountry, selectedDate, upDateCountries, upDateTexts, upDateMapView, stopPropagation);

}

function getEuJoinDate(obj){

            _.forEach(euJoinData, function(item){
                if (item.Country == obj.Country ){

                   //console.log(item.Country, item.compDate, obj.Country) ;
                } 
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
                                // continue here
                                
                                if (checkDate > election.compDate){  
                                  tempObj.lr = election.leftorright; 
                                  tempObj.Country = election.Country;
                                  tempObj.compDate = election.compDate;
                                  tempObj.eujoinDate = getEuJoinDate(election);
                                }
                            })

                        tempArr.push(tempObj)  

                    });    
            newObj.lrArr = tempArr;        
            tempGraphData.push(newObj)
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
    //console.log(tempGraphData)
    return tempGraphData;

}


function addD3Map(){
    var emptyDiv = document.getElementById('mapHolder');
    emptyDiv.innerHTML = " ";

    var padding = {top:0, right:0, bottom:0, left:0 } // left:220
    
    var width = 940, //320
        height = 640; //320

    //var center = d3.geo.centroid(json);    

    var projection = d3.geo.mercator()
        .center([20, 53]) //20, 50
        .rotate([4.4, 0]) //4.4, 0
        .scale(980 * 1) //650 * 0.7

        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);    

    var svg = d3.select("#mapHolder").append("svg")
        .attr("width", width - padding.left)
        .attr("height", height + margin.top);

        //new Tooltip({ container: '#mapHolder', positioner: this.id, margins:margin, dataObj:countryD, title: true, indicators:[

    var tooltipPartnership=new Tooltip({ container: '#mapHolder', margins:margin, title: false, indicators:[
                {
                  title:"Leader",
                  id:"govLeader"
                  
                },
                {
                  title:"Party",
                  id:"govParty"
                  
                }
        ] })    

    svg.selectAll(".subunit")
        .data(topojson.feature(euroMap, euroMap.objects.subunits).features)

    .enter().append("path")
        .attr("class", function(d) { var elClass = "none-europe "; if (d.properties.continent == "Europe"){ elClass = "europe" }; return elClass; }) // + d.id
        .attr("id", function(d){ return "shp_"+ formatStr(d.properties.name) }) //console.log(d);
        .attr("d", path);

     svg.selectAll(".europe")
         .on( "mousemove",function(){
              var x=d3.mouse(this)[0];
              x = Math.min(width-margin.right,x);

              var y=d3.mouse(this)[1];
              y = Math.min(height-margin.top,y);

              var countryD = findCountry(this)

              tooltipPartnership.show(countryD,x,y,countryD.Country);

      
              // if(country) {
        
              //     self.highlightPartnership(partnership);
              //     self.highlightProfile(partnership);
        
              //     //tooltip.show(series,xscale(series.date),0,status);//yscale.range()[0]);
              //     //highlightSeries(series.date);
              // }
            })
            .on("mouseleave",function(d){
              
              // self.highlightPartnership();
              // self.highlightProfile();
              //tooltip.hide();
              tooltipPartnership.hide();
            })   


        setTimeLineData();
}


function findCountry(d){


    var idArr = d.id.split("_");
    var tempArr = [];
    var tempObj;
    _.forEach(electionDataByCountry, function(elections){
      if(idArr[1]==elections[0]["Country"]){
          tempArr = elections
      }
     
    })

    _.forEach(tempArr, function(obj){
        if(obj.compDate < selectedDate){
          tempObj = obj;
        }
    })

    return tempObj
    
}




var upDateCountries = function(){
    var countries = d3.select("svg").selectAll(".europe");

    _.forEach(electionDataByCountry, function(item, key) {
         var currClipArr = getCurrClipArr(key);
                _.forEach(currClipArr, function(o){
                    updateCountryClass(d3.select(o), item.govNow);  
                })
         
    } );   
 }

var upDateTexts = function(d){
    var dateHolder = document.getElementById("dateDiv");

    var htmlStr = '<span class="bolder">'+moment(d.compDate).format('MMM YYYY')+'</span>';
    htmlStr += '<div class="key-graphs">';
    htmlStr += '<div class="a-key"><span class="a-key__colour left-wing"></span>Left wing</div>';
    htmlStr += '<div class="a-key"><span class="a-key__colour right-wing"></span>Right wing</div></div>';

    dateHolder.innerHTML = htmlStr;

    
    htmlStr = '<div class="a-key explainer">Oh explainer text goes here text goes here text goes here</div>';

    var keyHolder = document.getElementById("keyDiv");

    keyHolder.innerHTML = htmlStr;
    
 }

var stopPropagation = function() {
        d3.event.stopPropagation();
      }  


var upDateMapView = function(n){
    _.forEach(electionDataByCountry, function(item, key) {
        _.forEach(item, function(obj){
                if(obj.compDate < n){
                    item.govNow = obj.leftorright;
                }
        })
    }) 
    selectedDate = n;
    upDateCountries();

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

// function addD3AreaChart(data){
//        var width = 180 ,//- margin.left - margin.right
//         height = 420 - margin.top - margin.bottom;

//         var parseDate = d3.time.format("%d-%b-%Y").parse;

//         var x = d3.scale.linear()
//             .range([0, width-(margin.left + margin.right) ]);

//         var y = d3.time.scale()
//             .range([height, 0]);

//         var xAxis = d3.svg.axis()
//             .scale(x)
//             .orient("bottom");

//         var yAxis = d3.svg.axis()
//             .scale(y)
//             .orient("right")
//             .tickSize((width - margin.left - margin.right),0);

//         var areaR = d3.svg.area()
//             .x0(function(d) { return x(d.rightValue); })
//             .x1((width/2)-margin.right)
//             .y(function(d) { return y(d.date); });

//         var areaL = d3.svg.area()
//             .x0(function(d) { return x(d.leftValue * -1); })
//             .x1((width/2)-margin.left)
//             .y(function(d) { return y(d.date); }); 
           

//         var dateDivHolder = d3.select("#areaChartHolder").append("div")            
//             .attr("class","date-div")
//             .attr("id","dateDiv")
//             .style("margin", "0 "+(margin.left + margin.right)+"px 0 0")
//             .style("padding", "0 0 12px 0");


//         var svg = d3.select("#areaChartHolder").append("svg")
//             .attr("width", width + margin.left + margin.right)
//             .attr("height", height) //+ margin.top + margin.bottom
//           .append("g")
//             .attr("transform", "translate(" + margin.left + ", 0)");//" + margin.top + "

//         var keyDivHolder = d3.select("#areaChartHolder").append("div")            
//             .attr("class","date-div")
//             .attr("id","keyDiv")
//             .style("margin-right", (margin.left + margin.right)+"px");      

//         data.forEach(function(d) {
//              d.date = parseDate(d.date);
//           });

//         y.domain(d3.extent(data, function(d) { return d.date; }));
//         x.domain([-20, d3.max(data, function(d) { return d.close; })]);

//         svg.append("path")
//             .datum(data)
//             .attr("class", "area-right")
//             .attr("d", areaR);

//         svg.append("path")
//             .datum(data)
//             .attr("class", "area-left")
//             .attr("d", areaL);    

//         svg.append("g")
//             .attr("class", "x axis")
//             .attr("transform", "translate( 0 ," + height + ")")
//             .call(xAxis);

//         svg.append("line")
//               .attr("x1", width - margin.right)
//               .attr("stroke","#333")
//               .attr("x2", -30);

//         svg.append("line")
//               .attr("x1", width - margin.right)
//               .attr("stroke","#333")
//               .attr("x2", -30)
//               .attr("transform", "translate( 0 , "+ height +" )");      

//         svg.append("g")
//             .attr("class", "y axis")
//             .call(yAxis)
//           .selectAll("text")
//             .attr("y", -6)
//             .attr("x", -18)
//             .style("text-anchor", "start");
       
//       // .append("text")
//       //   .attr("transform", "rotate(-90)")
//       //   .attr("y", "200")
//       //   .attr("dy", "240")
//       //   .style("text-anchor", "end")
//       //   .text(" ");


//           var focus = svg.append("g")
//               .attr("class", "focus");
              
//           focus.append("line")
//               .attr("x1", width-margin.left-margin.right)
//               .attr("x2", 0);//(width-margin.left-margin.right)/2

//           // focus.append("rect")
//           //     .attr("class", "svg-underlay")
//           //     .attr("width", 60)
//           //     .attr("height", 18)
//           //     .attr("x", width-45)
//           //     .attr("y",8)

//           // focus.append("text")
//           //     .attr("dx", width-margin.left-margin.right)
//           //     .attr("dy", 0);

//           focus.append("circle")
//               .attr("r", 3)
//               .attr("transform", "translate( "+ (width-margin.left-margin.right)/2 +" , 0 )");

//           //svg.append("text").attr("transform", "translate( 90 , 120)").text(function() { return "Left" });  

//           svg.append("rect")
//               .attr("class", "svg-overlay")
//               .attr("id", "svgOverlay")
//               .attr("width", width)
//               .attr("height", height)
//               .on("mousemove", mousemove);

//               //.call(drag);
//               //
// var start = data[0].date; 
// var step = 1000 * 60 * 60 * 24 * 91.25; // approx 91 days - a quarter of year

// var offsets = data.map(function(t, i) { return [Date.UTC(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), t.lrCount, t]; });

// function mousemove() {  
//           stopPropagation()
//           var d = Math.round(y.invert(d3.mouse(this)[1]));
//           var obj = offsets[Math.round((d-start)/step)];

//           focus.select("g").attr("transform", "translate( 0 ,"+ d3.mouse(this)[1] +" )");
//           focus.select("circle").attr("transform", "translate( "+ (width-margin.left-margin.right)/2 +" , "+ d3.mouse(this)[1] +" )");
//           //focus.select("text").attr("transform", "translate( 0 , "+ (d3.mouse(this)[1] )+" )").text(function() { return moment(obj[2].compDate).format('MMM YYYY') });  
//           //focus.select("rect").attr("transform", "translate( 0 , "+ (d3.mouse(this)[1] - 20 )+" )");
//           focus.select("line").attr("transform", "translate( 0 , "+ (d3.mouse(this)[1])+" )");
//           //focus.select(".x").attr("transform", "translate(" + x(d[0]) + ",0)");
//           //focus.select(".y").attr("transform", "translate(0," + y(d[1]) + ")");
//           svg.selectAll(".x.axis path").style("fill-opacity", Math.random()); // XXX Chrome redraw bug

//           upDateMapView(obj[2].compDate)
//           upDateTexts(obj[2])

//         }

//       function stopPropagation() {
//         d3.event.stopPropagation();
//       }  

      
// }


