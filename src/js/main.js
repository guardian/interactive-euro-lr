import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'
import share from './lib/share'
import addD3AreaChart from './lib/addD3AreaChart'
import d3 from 'd3'

import lodash from 'lodash'
import topojson from 'topojson'
import d3Slider from './lib/d3Slider'
import euroMap from './mapData/subunits.json!json'
import moment from 'moment'
import twix from 'twix'
import 'moment/locale/en-gb';
moment.locale('en-gb')

var _ = lodash;
var shareFn = share('Interactive title', 'http://gu.com/p/URL', '#Interactive');
var electionData, electionDataByCountry, euCountries, euJoinData, startDate, endDate;


export function init(el, context, config, mediator) {

    console.log(moment.locale())


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
        item.unixFormat =  (DateFormat.getTime() / 1000).toFixed(0)
        item.Country = item["Country "];
        var newObj = {}
        newObj.Country = item["Country "];
        euCountries.push(newObj);
     })  

     _.forEach(electionData, function(item, i) {
         var DateFormat = new Date(manualDateFormat(item.DateCameToPower))   
         item.DateFormat = DateFormat;   //MM-DD-YYYY
         item.unixFormat =  (item.DateFormat.getTime() / 1000).toFixed(0)
         item.Country = formatStr(item.Country)

         console.log(moment(item.DateFormat).format('MM-DD-YYYY')+"---------"+item.DateFormat+"-------"+item.HeadofGovernment)
     
     }) 

    electionDataByCountry = _.groupBy(electionData, function(item) { return item.Country});

    buildView()  
}


function buildView(){

        addD3Map(); 
        setTimeLineData(); 
        addD3AreaChart(electionData);
        
}


function setTimeLineData(){

    console.log("ON FRIDAY  ---  START WORK HERE THE END DATE HAS LOST FORMATTING And Is resetting to 1970")

    console.log(euJoinData);

    console.log(electionData);


    startDate = euJoinData[0]["unixFormat"];
    endDate  = electionData[0]["unixFormat"];
        _.forEach(euJoinData, function(item, i) {
            if (startDate > item.unixFormat){ startDate = item.unixFormat;};
            

        }); 
        _.forEach(electionData, function(item, i) {
            if (endDate < item.unixFormat){ endDate =  item.unixFormat};
                
                //console.log(moment(item.DateFormat).format('MM-DD-YYYY'))
                //console.log( item )//item.Country+"---------"+moment(item.DateFormat).format('MM-DD-YYYY')
            
        });

    addD3Slider(startDate, endDate);
    getDatesRangeArray(startDate, endDate);

}


var getDatesRangeArray = function (startDate, endDate) {
    startDate = moment(startDate).format("MM-DD-YYYY");
    console.log(startDate, endDate)   //(moment(endDate).format("MM-DD-YYYY"))

    var itr = moment.twix(startDate, endDate).iterate("months");
    var range=[];
    
    while(itr.hasNext()){
        range.push(itr.next().format("YYYY-M-D"))
    }

    var graphDTemp = getGraphData(range);
    var graphD = getLRCount(graphDTemp);
}

function getLRCount(a){
    var L = 0;
    var R = 0;

    _.forEach(a , function(item){

                _.forEach(item.lrArr, function(o){
                    if(o.leftorright == "L"){ L++ }
                    if(o.leftorright == "R"){ R++ }
                })

            item.leftCount = L; item.rightCount = R;

        })

    return a;
}


function getGraphData(range){

    console.log(range)

    var tempGraphData = [];

        _.forEach(range, function(item, key){ // look for each month on the timeline

            var newObj={};
            var tempDateUTC = moment(item).unix(); // set utc date for newObj
            
            newObj.displayDate = moment.unix(tempDateUTC).format("DD/MMM/YYYY"); // adding a legible date
            newObj.lrArr = [];

                    _.forEach(electionDataByCountry, function(CountryElections,key){
                        

                        // CountryElections returns ---
                            // Country: "UK"
                            // DateCameToPower: "19/06/1970"
                            // DateFormat: Sun Jul 19 1970 00:00:00 GMT+0000 (BST)
                            // HeadofGovernment: "Edward Heath"
                            // Totalitarian: "0"
                            // leftorright: "R"
                            // partyOrCoalition: "Conservative"
                            // unixFormat: 17193600000


                            var tempLr = {};

                            tempLr.country = key;

                                _.forEach(CountryElections, function(election){
                                    // something wrong below as its returning a number lower than tempDatUTC but NOT the highest number untempDatUTC which is what we wnat
                                    // sort election on unixFormat 
                                    if(election.unixFormat < tempDateUTC){
                                        
                                        tempLr.leftorright = election.leftorright;

                                    }

                                });

                        newObj.lrArr.push(tempLr)
                        
                        
                    });

                // set the last date vars and push to outputArr    
                newObj.utcDate = tempDateUTC; 
                tempGraphData.push(newObj)

        });
    console.log(tempGraphData)
    return tempGraphData;
}




function addD3Map(){
    var emptyDiv = document.getElementById('mapHolder');
    emptyDiv.innerHTML = " ";
    
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
        .attr("class", function(d) { var elClass = "none-europe "; if (d.properties.continent == "Europe"){ elClass = "europe" }; return elClass; }) // + d.id
        .attr("id", function(d){  return "shp_"+ formatStr(d.properties.name) }) //console.log(d);
        .attr("d", path); 
}

function addD3Slider(minDateUnix,maxDateUnix){
    var sliderDiv = document.getElementById('slider3');
    sliderDiv.innerHTML = " ";
    // var minDateUnix = moment('2014-07-01', "YYYY MM DD").unix();
    // var maxDateUnix = moment('2015-07-21', "YYYY MM DD").unix();
    var secondsInDay = 60 * 60 * 24;


        d3.select('#slider3').call(d3Slider()
          .axis(true)
            .min(minDateUnix)
            .max(maxDateUnix)
            .step(secondsInDay)

          .on("slide", function(evt, value) {
                    // var newData = _(site_data).filter( function(site) {
                    //   return site.created_at < value;
                    // })
           upDateMapView(value)
            //displaySites(newData);
          })
        );
}

function upDateMapView(n){


    _.forEach(electionDataByCountry, function(item, key) {
        _.forEach(item, function(obj){
                if(obj.unixFormat < n){
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
                        updateCountryClass(d3.select(o), item.govNow)  
                })
         
    } );   
 }


function getCurrClipArr(s){
    console.log(s)
    var a = [];
    if ( s != "Germany"){ a.push("#shp_"+s) }
    //if (s != "Belgium" && s != "UK" && s != "Germany" ){  }
    if (s == "Germany"){ a = [ ];  a.push("#shp_West-Germany"); a.push("#shp_East-Germany"); }
    //if (s == "Belgium"){  var a = [ ];  a.push("#shp_Walloon"); a.push("#shp_Flemish");  a.push("#shp_Brussels") }
    //if (s == "UK"){  var a = [ ]; a.push("#shp_N--Ireland") ; a.push("#shp_Scotland"); a.push("#shp_Wales"); a.push("#shp_England") }
    console.log(a)   
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


