export default function Tooltip(options) {


  var w=options.width || 200,
    h=options.height || 110;

  var positioner = d3.select(options.positioner)  

  var tooltip=d3.select(options.container)//'#mapHolder'
          .append("div")
            .attr("class","tooltip arrow_box clearfix")
            .style("height", function(){
              return (options.height)+"px";
            })
            .style("width",function(){
              return (options.width)+"px";
            })
  var tooltipTitle;
  if(options.title) {
    tooltipTitle=tooltip.append("h1")
      .attr("class","tooltip-title")
      .text(options.dataObj.Country)  
  }
  

  var indicator=tooltip.selectAll("div.indicator")
      .data(options.indicators,function(d){
        return d.id;
      })
      .enter()
      .append("div")
        .attr("class","indicator clearfix")

  var value=indicator.append("span")
        .attr("class","value")
        .attr("id",function(d){
          return d.id;
        });

  indicator.append("span")
        .attr("class","title")
        .text(function(d){
          return d.title;
        });

  this.hide=function() {
    tooltip.classed("visible",false);
  };
  this.show=function(data,x,y,title) {
    //console.log(x,y)
    //percentage.text(data.percentage+"%");
    //projection_value.text(data.total)

    // if(title) {
    //   tooltipTitle.text(title); 
    // }
    

    indicator.data(data);

    indicator.select("span.value")
      .text(function(d){
        //console.log("AAAHHHHHHHHHH",d,this)
        return d.value;
      })

    tooltip.style({
      left:(x+16+options.margins.left)+"px",
      top:(y+options.margins.top-60)+"px"
    })
    .classed("visible",true)
    
  };

  // console.log("!!!!!!!!!!!",tooltip)

}



// var tooltipPlayer=new Tooltip({
//       container:partnershipTimeline.node(),
//       margins:margins,
//       indicators:[
//         {
//           id:"playerRuns",
//           title:"Runs"
//         },
//         {
//           id:"playerBalls",
//           title:"Balls"
//         },
//         /*{
//           id:"playerSR",
//           title:"SR"
//         },*/
//         {
//           id:"playerFourSix",
//           title:"4s/6s"
//         }
//       ]
//     })


