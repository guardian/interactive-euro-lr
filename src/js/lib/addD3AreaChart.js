import d3 from 'd3'

export default function addD3AreaChart(data){

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
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

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
            console.log(d)
            d.date = parseDate(d.compDate);
            d.temperature = + d.lrCount;
          });

          x.domain([d3.max(data, function(d) { return d.temperature; }), -16]);
          y.domain([data[data.length - 1].date, data[0].date]);

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

              infobox.append("line")
              .attr("x1", width)
              .attr("x2", 0);

              var focus = svg.append("g")
              .attr("class", "focus");

              focus.append("circle")
              .attr("r", 2);

              infobox.append("text")
              .attr("x", -6)
              .attr("y", -9);

              svg.append("rect")
                .attr("class", "svg-overlay")
                .attr("width", width)
                .attr("height", height)
                .on('click', function(e) { console.log(' clicking area', e); })
                .on("mousemove", mousemove());

                

      function mousemove() {
          var d = offsets[Math.round((x.invert(d3.mouse(this)[0]) - start) / step)];
          focus.select("circle").attr("transform", "translate(" + x(d[0]) + "," + y(d[1]) + ")");
          focus.select(".x").attr("transform", "translate(" + x(d[0]) + ",0)");
          focus.select(".y").attr("transform", "translate(0," + y(d[1]) + ")");
          svg.selectAll(".x.axis path").style("fill-opacity", Math.random()); // XXX Chrome redraw bug
        }
}





