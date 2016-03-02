export default function addD3AreaChart(electionData){
    var emptyDiv = document.getElementById('areaChartHolder');
    emptyDiv.innerHTML = " ";


    console.log(electionData)
        
    var dataset = electionData;

    var margin = {top: 18, right: 20, bottom: 6, left: 2},
        width = 140,
        height = 600 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y-%m-%d").parse, bisectDate = d3.bisector(function(d) { return d.date; }).left;

    var x = d3.time.scale()
    .range([0, width]);

    var y = d3.scale.linear()
    .range([height, 0]);

    var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(d3.time.format("%b"))
    .tickSize(height)
    .outerTickSize(0)
    .orient("top");

    var yAxis = d3.svg.axis()
    .scale(y)
    .tickSize(width)
    .ticks(3)
    .tickPadding(-10)
    .orient("right");
    // console.log(y.ticks(5).map(y.tickFormat(5, "+%")))

    var area = d3.svg.area()
    .x(function(d) { return x(d.date); })
    .y0(height)
    .y1(function(d) { return y(d.close); });

    var svg = d3.select("#areaChartHolder").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });

    var data = weeklyTotalsArr.map(function(d) {

        return {
            //  dateLabel : d.dateLabel, 
            date: parseDate(d.dateStr),
            close: d.plagueCount,
            weekNum: d.weekNum
        };

    });

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain(d3.extent(data, function(d) { return d.close; }));

    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .selectAll("text")
    .attr("y", -9)  
    .append("text");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    svg.append("path")
    .datum(data)
    .attr("class", "area")
    .attr("d", area);

    var infobox = svg.append("g")
    .attr("class", "infobox")
    .attr("id", "infoBox");

    infobox.append("rect")
    .attr("height", height)
    .attr("x",-10)
    .attr("width", 20);

    infobox.append("line")
    .attr("y1", height)
    .attr("y2", 0);

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
    .on("mouseover", function() { focus.style("display", null); infobox.style("display", null);})
    // .on("mouseout", function() { focus.style("display", "none"); })
    .on("mousemove", mousemove);

    var openingWeek = getObj("week_34", data, "weekNum"); 
    focus.attr("transform", "translate(" + x(openingWeek.date) + "," + y(openingWeek.close) + ")");
    infobox.attr("transform", "translate(" + x(openingWeek.date) + ",0)"); 
    var htmlStatStr = format1000(openingWeek.close);
    document.getElementById('weekCount').innerHTML = htmlStatStr;

    updateMapSize();
    updateTexts(openingWeek.weekNum);  

    function mousemove(e) {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
        infobox.attr("transform", "translate(" + x(d.date) + ",0)");
        var htmlStr = format1000(d.close);
        document.getElementById('weekCount').innerHTML = htmlStr;
        updateTexts(d.weekNum);
      }
    

      



    function formatAxisLabel(d) {    
        return d === y.domain()[1]  ? "Plague burials" + d + " thousands" : d;
    }
}