'use strict';

(function() {

  let data = "no data";
  let allYearsData = "no data";
  let svgScatterPlot = ""; // keep SVG reference in global scope
  let svgLineGraph = "";
  let div ="";
  //let tooltip = { width: 100, height: 100, x: 10, y: -30 };

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgLineGraph = d3.select("body")
    .append('svg')
    .attr('width', 500)
    .attr('height', 500);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        allYearsData = csvData;
        var distinct = (value, index, self) => {
            return self.indexOf(value) == index;
            
        }

        //ADD DISTINCT YEARS to dropdown
      let countries = allYearsData.map((row) => row['location'])
      var distinctCountries = countries.filter(distinct)

      var dropDown = d3.select('body')
      .append('select')
      .on('change', function() {
          makeLineGraph(this.value)
          svgScatterPlot = div
          .append('svg')
          .attr('width', 500)
          .attr('height', 500);
      });

    var options = dropDown.selectAll('option')
      .data(distinctCountries)
      .enter()
        .append('option');
        options.text((d) => { return d; });

        options.text(function(d) {
          return d
        })
        .attr("value", function(d) {return d})
        
      //give the parameter a variable so it depends on dropbox output/selection
      makeLineGraph(options);
      });
  }

  // make scatter plot with trend line
  function makeScatterPlot(year) {
    console.log("hello")
    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot, {min: 50, max: 250}, {min: 50, max: 250});

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgScatterPlot.append('text')
      .attr('x', 8)
      .attr('y', 30)
      .style('font-size', '9pt')
      .text("Countries by Life Expectancy and Fertility Rate (" + data[0]["time"] + ")");

    svgScatterPlot.append('text')
      .attr('x', 50)
      .attr('y', 280)
      .style('font-size', '8pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 200)rotate(-90)')
      .style('font-size', '8pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([1, 8]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // append data to SVG and plot as points
    svgScatterPlot.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["pop_mlns"]))
        .attr('fill', "#4286f4")
  }

  function makeLineGraph(country) {
    svgLineGraph.html("");
    let countryData = allYearsData.filter((row) => row["location"] == country);
    let timeData = countryData.map((row) => row["time"]);
    let populationData = countryData.map((row) => parseFloat(row["pop_mlns"]));

    let minMax = findMinMax(timeData, populationData);

    let funcs = drawAxes(minMax, "time", "pop_mlns", svgLineGraph, {min: 50, max: 450}, {min: 50, max: 450});
    plotLineGraph(funcs, countryData, country);
  }

  function plotLineGraph(funcs, countryData, country) {
    let line = d3.line()
      .x((d) => funcs.x(d))
      .y((d) => funcs.y(d));

        // make tooltip
        div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    svgLineGraph.append('path')
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)

    .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);

        div
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY) + "px")
          .append(makeScatterPlot());
      })

      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
  });

    svgLineGraph.append('text')
      .attr('x', 230)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgLineGraph.append('text')
      .attr('x', 130)
      .attr('y', 30)
      .style('font-size', '14pt')
      .text("Population vs Time by Country: " + country);

    svgLineGraph.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population (Million)');

  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale) .tickFormat(d3.format("d"));
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
