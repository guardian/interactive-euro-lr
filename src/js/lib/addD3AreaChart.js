import d3 from 'd3'

export default function addD3AreaChart(data){
  var value;
        var dispatch = d3.dispatch("myEvent", value);
        

        var targetDiv = document.getElementById('areaChartHolder');
            targetDiv.innerHTML = " ";
   
        var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = 240 - margin.left - margin.right,
            height = 620 - margin.top - margin.bottom;

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
        

        

        // var offsets = data.map(function(t, i) { 
        //   return [ Date.UTC(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), t.temperature, t.date, t]; 
        // });

        var offsets = data.map(function(t, i) { return [Date.UTC(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), t.temperature, t]; });

          x.domain([d3.max(data, function(d) { return d.temperature; }), -16]);
          y.domain([data[data.length - 1].msec, data[0].msec]);

        //console.log(start + (offsets.length - 1) * step)  

        // var offsets = data.map(function(t, i) { 
        //   return [ Date.UTC(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), t.temperature, t.date, t]; 
        // });

        
        //   x.domain([d3.max(data, function(d) { return d.temperature; }), -16]);
        //   y.domain([start + (offsets.length - 1) * step , start ])

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

          var drag = d3.behavior.drag();
                drag.on('dragend', function () {
                  dispatch.slideend(d3.event, value);
                })


          var infobox = svg.append("g")
              .attr("class", "infobox")
              .attr("id", "infoBox");

              infobox.append("rect")
              .attr("width", width)
              .attr("x",-10)
              .attr("height", 20)
              .on("click", stopPropagation)
              .call(drag);



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

          console.log(obj[2])

          focus.select("line").attr("transform", "translate( 0 ,"+ d3.mouse(this)[1] +" )");
          focus.select("circle").attr("transform", "translate( "+ x(obj[1])  +" , "+ d3.mouse(this)[1] +" )");
          //focus.select(".x").attr("transform", "translate(" + x(d[0]) + ",0)");
          //focus.select(".y").attr("transform", "translate(0," + y(d[1]) + ")");
          svg.selectAll(".x.axis path").style("fill-opacity", Math.random()); // XXX Chrome redraw bug

          upDateMapView(d)

          // dispatch(d3.event, obj);
        }

      function stopPropagation() {
        d3.event.stopPropagation();
      }

      
}





