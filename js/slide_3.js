var countries_info_sl3;
var country_id_sl3_sl3;
var data_sl3;
var ntop = 10;
var population = 50000000;
var axis_type = "linear";

(function () {
	if (data_sl3 === undefined) {
		var promises = [];
	    promises.push(d3.csv("data/covid-data.csv"));    
	    
	    Promise.all(promises).then(function(values) {
			cdata = convert_data(values);
			countries_info_sl3 = sort_countries(cdata[0], "cases"); 
			country_id_sl3 = countries_info_sl3[0].id;
			data_sl3 = cdata[1];			

			drawChart(data_sl3[country_id_sl3]);
			add_text();
	    });
	}
})();

function get_info(countries_info_sl3, country_id_sl3) {
	res = countries_info_sl3.find(function(d) {		
		if (d.id == country_id_sl3) {
			return d;			
		}
	});

	return res;
}

function get_top(countries_info_sl3, ntop) {	
	return countries_info_sl3.filter(function(d,i) { if (i < ntop) return d; });
}

function sort_countries(countries_info_sl3, type) {	
	function compare(s1, s2) {
		//s1 = s1.max_new_deaths_pmil/s1.max_new_cases_pmil, s2 = s2.max_new_deaths_pmil/s2.max_new_cases_pmil;
		s1 = s1.population, s2 = s2.population;

		if ( s1 < s2 ) {
			return -1;
		}
		if ( s1 > s2 ) {
			return 1;
		}
			return 0;
	}
	
	return countries_info_sl3.sort(compare).reverse();
}

function convert_data(values) {
	const parseTime = d3.timeParse("%m/%d/%Y");
    
	var converted_data = {};
	values[0].forEach(function(d) {
		var date = parseTime(d["date"]); 
		if (converted_data[d["iso_code"]] === undefined) {
		  converted_data[d["iso_code"]] = new Array();
		}       
		converted_data[d["iso_code"]].push( {"date": date, "cases_pmil": +d["total_cases_per_million"], "deaths_pmil": +d["total_deaths_per_million"], "new_cases_pmil": +d["new_cases_per_million"], "new_deaths_pmil": +d["new_deaths_per_million"], "population": +d["population"], "name": d["location"]} );
	});

	var countries_info_sl3 = [];
	var minDate = new Date(2020, 11, 31), maxDate = new Date(2020, 0, 1), cum_cases_max = 0, cum_deaths_max = 0; cum_new_cases_max = 0; cum_new_deaths_max = 0;
	for (var key in converted_data) {        
		curMinDate = d3.min(converted_data[key], function(d) { return d.date });
		minDate = (minDate > curMinDate) ? curMinDate : minDate;       

		curMaxDate = d3.max(converted_data[key], function(d) { return d.date });
		maxDate = (maxDate < curMaxDate) ? curMaxDate : maxDate;

		cur_cases_max = d3.max(converted_data[key], function(d) { return d.cases_pmil; });
		cum_cases_max = (cum_cases_max < cur_cases_max) ? cur_cases_max : cum_cases_max;

		cur_new_cases_max = d3.max(converted_data[key], function(d) { return d.new_cases_pmil; });
		cum_new_cases_max = (cum_new_cases_max < cur_new_cases_max) ? cur_new_cases_max : cum_new_cases_max;

		cur_deaths_max = d3.max(converted_data[key], function(d) { return d.deaths_pmil; });
		cum_deaths_max = (cum_deaths_max < cur_deaths_max) ? cur_deaths_max : cum_deaths_max;

		cur_new_deaths_max = d3.max(converted_data[key], function(d) { return d.new_deaths_pmil; });
		cum_new_deaths_max = (cum_new_deaths_max < cur_new_deaths_max) ? cur_new_deaths_max : cum_new_deaths_max;

		countries_info_sl3.push({"id": key, "name": converted_data[key][0].name,  "population": converted_data[key][0].population, "max_new_cases_pmil": cur_new_cases_max, "max_new_deaths_pmil": cur_new_deaths_max, "max_cases_pmil": cur_cases_max, "max_deaths_pmil": cur_deaths_max, "min_date": curMinDate, "max_date": curMaxDate});
	}

	return [countries_info_sl3, converted_data];
}

function drawChart(cdata) {
	slide_ind = 3;
	console.log(`slide ${slide_ind}`);

	/*
	d3.select(`#slide_${slide_ind}`)
		.insert("div", ":first-child")
		.attr("id", "slider_range")		
		//.html("<span>1k people</span><input type='range' min=1000 max=1500000000 value=50000000><span>1.5kkk people</span>");
		.append("input")
		.attr("type", "range")
		.attr("min", 1000)
		.attr("max", 1500000000)
		.property("value", 50000000)
		.on("change", function() {
			population = d3.select(this).property("value");
		});
	*/
	d3.select(`#slide_${slide_ind}`).select(".chart")		
		.insert("div", ":first-child")
		.attr("id", "dd_btn_s3-1")
		.append("select")		
		.on("change", function(d) {
			ntop = d3.select(this).property("value");
			update();
		})
		.selectAll('option')
		.data([{"name": "top10", "value": "10"}, {"name": "top20", "value": "20"}, {"name": "top30", "value": "30"}, {"name": "all", "value": countries_info_sl3.length}])
		.enter()
		.append('option')
		.text(function (d) { return d.name; })
		.attr("value", function (d) { return d.value; });

	d3.select(`#slide_${slide_ind}`).select(".chart")		
		.insert("div", ":first-child")
		.attr("id", "dd_btn_s3-2")
		.append("select")
		.on("change", function(d) {
			axis_type = d3.select(this).property("value");
			update();
		})
		.selectAll('option')
		.data(["linear", "log"])
		.enter()
		.append('option')
		.text(function (d) { return d; })
		.attr("value", function (d) { return d; });

	var svg = d3.select(`#slide_${slide_ind}`).select(".chart").select("svg");

    var margin = 50;
    var width = +svg.attr("width") - 4*margin;
    var height = +svg.attr("height") - 2*margin;
    
    var group = svg.append("g")
		.attr("transform", "translate(" + margin + "," + margin + ")");

	var x = d3.scaleLinear() //scaleLog
		.range([0, width]);
	var y = d3.scaleLinear() //scaleLog
		.range([height, 0]);
	
	var xAxis = d3.axisBottom().scale(x);	 
	var yAxis = d3.axisLeft().scale(y);

	group
		.append("g")
		.attr("transform", "translate("+ margin +"," + height + ")")
		.style("font-size", "0.9em")
		.attr("id", "x_axis");
	group
		.append("g")
		.attr("transform", "translate("+ margin +",0)")
		.style("font-size", "0.9em")
		.attr("id", "y_axis");

    svg
		.append("text")
	    .attr("text-anchor", "middle")
	    .attr("transform", "translate("+(width/2 + 2*margin)+","+(height+margin+40)+")")
	    .attr("font-weight", "bold")
	    .text("Number of new cases(per million)");

	svg
		.append("text")
	    .attr("text-anchor", "middle")
	    .attr("transform", "translate("+(margin-5)+","+(height/2+margin)+")rotate(-90)")
	    .attr("font-weight", "bold")
	    .text("Number of new deaths(per million)");

	group
		.append("g")
		.attr("id", "circles")
		.attr("transform", "translate("+ margin +",0)");

	var zoom = d3.zoom()
	    .scaleExtent([1, 50])
	    .extent([[0, 0], [width, height]])
		.on("zoom", update);

	svg.call(zoom);

	var colors = d3.scaleOrdinal(d3.schemeCategory10);

	var an1 = svg
		.append("g")
		.attr("transform", "translate(" + 0 + "," + 0 + ")")
		.attr("class", "annotation")
		.attr("opacity", -1);
	
	an1
		.append("g")
		.attr("transform", "translate(" + 690 + "," + 140 + ")")
		.attr("class", "rt")
		.append("rect")
		.attr("x", -135)
		.attr("y", 130)
		.attr("width", 190)
		.attr("height", 80)
		.attr("opacity", 0.05)
		.attr("stroke", "lightgrey")
		.attr("stroke-width", 1);

	an1.select("g.rt")
		.append("text")		
		.attr("x", -35)
	    .attr("y", 145)
		.style("fill", "black")
		.attr("opacity", 0.6)
		.attr("text-anchor", "middle");
	
	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "1.1em")
		.text("People from the countries");

	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "2.2em")
		.text("below the line");

	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "3.3em")
		.text("have better chances");

	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "4.4em")
		.text("to recover");

	an1
		.append("g")
		.attr("transform", "translate(" + 650 + "," + 429 + ")")
		.attr("class", "lc")
		.append("line")
		.attr("stroke", "darkgrey")
	    .attr("stroke-width", 1)
	    .attr("stroke-dasharray", "5,5")
	    .attr("x1", 0)
	    .attr("y1", 0)
	    .attr("x2", 0)
	    .attr("y2", -80);

	an1.select("g.lc")
		.append("circle")
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("r", 4)
		.attr("fill", "darkgrey");

	an1
		.append("line")
		.attr("stroke", "darkgrey")
	    .attr("stroke-width", 1)
	    .attr("stroke-dasharray", "5,5")
	    .attr("x1", 100)
	    .attr("y1", 750)
	    .attr("x2", 1300)
	    .attr("y2", 50);


	update();

  	function update() {
  		c_info = get_top(countries_info_sl3, ntop);

  		x_max = d3.max(c_info, function(d) { return d.max_cases_pmil; });
  		y_max = d3.max(c_info, function(d) { return d.max_deaths_pmil; });

  		if (axis_type == "linear") {
  			x = d3.scaleLinear()
  				.domain([0, x_max])
				.range([0, width]);
			y = d3.scaleLinear() 
				.domain([0, y_max])
				.range([height, 0]);
  		} else if (axis_type == "log") {
  			x = d3.scaleSymlog()
  				.domain([0, x_max])
				.range([0, width])
				.nice();
				
			y = d3.scaleSymlog() //scaleLog
				.domain([0, y_max])
				.range([height, 0])	
				.nice();			
  		}

  		try {
	  		x = d3.event.transform.rescaleX(x);
		    y = d3.event.transform.rescaleY(y);
		} catch {

		}

  		xAxis = d3.axisBottom().scale(x).ticks(4);	 
		yAxis = d3.axisLeft().scale(y).ticks(5);
		
		svg.select("#x_axis")
		  	.transition()
		    .duration(1000)
		    .call(xAxis);

	  	svg.select("#y_axis")
		    .transition()
		    .duration(1000)
		    .call(yAxis);

		group.select("#circles").selectAll("*").remove();

		d3.select("#circles")
			.selectAll("circle")
			.data(c_info)
			.enter()
			.append("circle")
				.attr("cx", function(d,i) { return x(d.max_cases_pmil) } )
				.attr("cy", function(d,i) { return y(d.max_deaths_pmil) } )
				.attr("fill", function(d,i) { return colors(i) })
				.attr("opacity", 0.8)
				.transition()
				.duration(500)
				.attr("r", 15);
		
		d3.select("#circles")
			.selectAll("circle")
			.on("mouseover", function(d) {	   
				d3.select(this).classed("circle-selected", true);                    
				        
				d3.select("#cinfo")
					.transition()
					.duration(250)		
					.style("opacity", 0.8);
				        
				var tooltip = `
					<span><b>${d.name}</b><span><br/>
					<table>
					<tr><td><span>Cases(per mil):</td><td>${d.max_cases_pmil}<span></tr></td>
					<tr><td><span>Deaths(per mil):</td><td>${d.max_deaths_pmil}<span></tr></td>
					<tr><td><span>Deaths/Cases:</td><td>${(d.max_deaths_pmil/d.max_cases_pmil).toFixed(4)}<span></tr></td>
					<tr><td><span>Population:</td><td>${d.population}<span></tr></td>
					</table>      
				`;

				d3.select("#cinfo").html(tooltip)	
					.style("left", +d3.event.pageX+"px")		
					.style("top", +d3.event.pageY-2*margin+"px");	
			})
			.on("mouseout", function(d) {
				d3.select(this).classed("circle-selected", false)
				d3.select("#cinfo").transition()		
					.style("opacity", 0);
			});
				
		d3.select("#circles")
			.selectAll("text")
			.data(c_info)
			.enter()
			.append("text")
				.text(function(d) { return d.name; })
				.attr("x", function(d,i) { return x(d.max_cases_pmil)} )
				.attr("y", function(d,i) { return y(d.max_deaths_pmil)} )
				.attr("font-size", "0.8em");

		if (an1.attr("opacity") == -1) {
			an1
				.transition()
				.duration(500)
				.attr("opacity", 1);
		} else {
			an1
				.transition()
				.duration(500)
				.attr("opacity", 0 );
		}
	}
}

function add_text() {
	var txt = `
	<p>
	<span>
	The damage done by the coronavirus is enormous. And these are not so much financial losses as human ones. In different countries, the percentage of people infected with the coronavirus and people who died from it later is different. But where do people recover more often, and where do they die?
	</span>
	</p>
	<p>
	<span style="font-style: italic;font-size: 0.8em">
	This slide displays the countries of the world in terms of the number of cases and deaths per 1 million people. There are two dropdown menus in the upper right corner. The first one allows to filter displayed countries, the second one changes the scale from the linear to the logarithmic one. Additional information is provided by hovering over a specific country. For better visual experience, you can use the <b>ZOOM IN/OUT</b> function(by scrolling the mouse wheel) and <b>PANNING</b> function(by holding down the left mouse button and dragging the mouse).
	</span>
	</p>
	`
	d3.select("#slide_3 div.story").html(txt);
}