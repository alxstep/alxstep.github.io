var countries_info;
var country_id;
var data;

(function () {
	if (data === undefined) {
		var promises = [];
	    promises.push(d3.csv("data/WHO-COVID-19-global-data.csv"));    
	    
	    Promise.all(promises).then(function(values) {
			cdata = convert_data(values);
			countries_info = sort_countries(cdata[0], "cases"); 
			country_id = countries_info[0].id;
			data = cdata[1];

			drawChart(data[country_id]);
			add_text();
	    });
	}
})();


function sort_countries(countries_info, type) {	
	function compare(s1, s2) {
		if (type == "cases") {
			s1 = s1.max_cases, s2 = s2.max_cases;
		}
		else if (type == "deaths") {
			s1 = s1.max_deaths, s2 = s2.max_deaths;
		}

		if ( s1 < s2 ) {
			return -1;
		}
		if ( s1 > s2 ) {
			return 1;
		}
			return 0;
	}
	
	return countries_info.sort(compare).reverse();
}

function get_info(countries_info, country_id) {
	res = countries_info.find(function(d) {		
		if (d.id == country_id) {
			return d;			
		}
	});

	return res;
}

function get_day_info(data, country_id, date) {
	res = data[country_id].find(function(d) {		
		if (d.date.getFullYear() == date.getFullYear() && d.date.getMonth() == date.getMonth() && d.date.getDate() == date.getDate()) {			
			return d;			
		}
	});

	return res;
}

function convert_data(values) {
	const parseTime = d3.timeParse("%m/%d/%Y");
    
	var converted_data = {};
	values[0].forEach(function(d) {
		var date = parseTime(d["Date_reported"]); 
		if (converted_data[d[" Country_code"]] === undefined) {
		  converted_data[d[" Country_code"]] = new Array();
		}       
		converted_data[d[" Country_code"]].push( {"date": date, "cases": +d[" Cumulative_cases"], "deaths": +d[" Cumulative_deaths"], "new_cases": +d[" New_cases"], "new_deaths": +d[" New_deaths"], "name": d[" Country"]} );
	});

	var countries_info = [];
	var minDate = new Date(2020, 11, 31), maxDate = new Date(2020, 0, 1), cum_cases_max = 0, cum_deaths_max = 0;
	for (var key in converted_data) {        
		curMinDate = d3.min(converted_data[key], function(d) { return d.date });
		minDate = (minDate > curMinDate) ? curMinDate : minDate;       

		curMaxDate = d3.max(converted_data[key], function(d) { return d.date });
		maxDate = (maxDate < curMaxDate) ? curMaxDate : maxDate;

		cur_cases_max = d3.max(converted_data[key], function(d) { return d.cases; });
		cum_cases_max = (cum_cases_max < cur_cases_max) ? cur_cases_max : cum_cases_max;

		cur_deaths_max = d3.max(converted_data[key], function(d) { return d.deaths; });
		cum_deaths_max = (cum_deaths_max < cur_deaths_max) ? cur_deaths_max : cum_deaths_max;

		countries_info.push({"id": key, "name": converted_data[key][0].name, "max_cases": cur_cases_max, "max_deaths": cur_deaths_max, "min_date": curMinDate, "max_date": curMaxDate});
	}

	return [countries_info, converted_data];
}

function drawChart(cdata) {
	slide_ind = 2;
	console.log(`slide ${slide_ind}`);

	d3.select(`#slide_${slide_ind}`)
		.select(".chart")		
		.insert("div", ":first-child")
		.attr("id", "dd_btn_s2")
		.append("select")
		.on("change", function(d) {
			country_id = d3.select(this).property("value");
			update();
		})
		.selectAll('option')
		.data(countries_info)
		.enter()
		.append('option')
		.text(function (d) { return d.name; })
		.attr("value", function (d) { return d.id; });

	var svg = d3.select(`#slide_${slide_ind}`).select(".chart").select("svg");

    var margin = 50;
    var width = +svg.attr("width") - 4*margin;
    var height = +svg.attr("height") - 2*margin;
    
    var group = svg.append("g")
		.attr("transform", "translate(" + margin + "," + margin + ")");

    var cpath = group.append("path")
    	.attr("transform","translate("+margin+","+"0)")

    var dpath = group.append("path")
    	.attr("transform","translate("+margin+","+"0)")

	var x = d3.scaleTime()
		.range([0, width]);
	var y = d3.scaleLinear() //scaleLog
		.range([height,0]);
	
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
	    .text("Date");

	svg
		.append("text")
	    .attr("text-anchor", "middle")
	    .attr("transform", "translate("+(margin-30)+","+(height/2+margin)+")rotate(-90)")
	    .attr("font-weight", "bold")
	    .text("Total number of cases/deaths");

	group
    	.append("text")
    	.attr("id", "clabel")
	    .attr("opacity", 0)
	    .text("cases");

	group
    	.append("text")
    	.attr("id", "dlabel")
	    .attr("opacity", 0)
	    .text("deaths");

	group
		.append("line")
		.attr("id", "vline")
		.attr("y1", height)
		.attr("y2", 0)
		.attr("opacity", 0)		
		.attr("stroke", "grey");

	d3.select("#slide_2 div.chart")
		.on('mousemove', function() {
			xcoord = (d3.mouse(this)[0] < 2*margin) ? 2*margin : (d3.mouse(this)[0] <=width+2*margin) ? d3.mouse(this)[0] : width+2*margin;

    		var day_info = get_day_info(data, country_id,  x.invert(xcoord-2*margin));

    		d3.select("#vline").attr("opacity", 0.8).attr("transform", "translate("+(xcoord-margin)+",0)");

    		var txt = `    			
    			<span><b>${day_info.name}</b></span><br>
    			<span style="{font-size: 0.8em}">Daily statistics</span>
    			<table>
		            <tr><td>Date:</td><td>${(day_info.date.getMonth()+1)+'/'+day_info.date.getDate()+'/'+day_info.date.getFullYear()}</td></tr>
		            <tr><td>New Cases:</td><td>${day_info.new_cases}</td></tr>
		            <tr><td>New Deaths:</td><td>${day_info.new_deaths}</td></tr>
		            <tr><td>Total Cases:</td><td>${day_info.cases}</td></tr>
		            <tr><td>Total Deaths:</td><td>${day_info.deaths}</td></tr>
	            </table>
            `;

            d3.select("#info_box").html(txt);

            if (an1.attr("opacity") == 1) {
            	an1
            		.transition()
            		.duration(500)
            		.attr("opacity", 0);
            }
            if (an2.attr("opacity") == 1) {
            	an2
            		.transition()
            		.duration(500)
            		.attr("opacity", 0);
            }

    		//d3.event.preventDefault();
		})
		.on('mouseout', function() {
			d3.select("#vline").attr("opacity", 0);
			d3.select("#info_box").style("border", "1px solid white");
			d3.select("#info_box").html("Daily statistics");
		});

	d3.select("#info_box").html("Daily statistics");

	var cline = d3.line()
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.cases); });

	var dline = d3.line()
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.deaths); });

	// var area = d3.area()
	//     .x(function(d) { return x(d.date); })
	//     .y0(height)
	//     .y1(function(d) { return y(d.cases); });

	var an1 = svg
		.append("g")
		.attr("transform", "translate(" + 600 + "," + 580 + ")")
		.attr("class", "annotation")
		.attr("opacity", -1);
	
	an1
		.append("g")
		.attr("transform", "translate(" + 50 + "," + (-200) + ")")
		.attr("class", "rt")
		.append("rect")
		.attr("x", -120)
		.attr("y", 130)
		.attr("width", 160)
		.attr("height", 65)
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
		.text("COVID-19 cases");

	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "2.2em")
		.text("are rising");

	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "3.3em")
		.text("across the world");

	an1
		.append("g")
		.attr("transform", "translate(" + 10 + "," + 125 + ")")
		.attr("class", "lc")
		.append("line")
		.attr("stroke", "darkgrey")
	    .attr("stroke-width", 1)
	    .attr("stroke-dasharray", "5,5")
	    .attr("x1", 0)
	    .attr("y1", 0)
	    .attr("x2", 0)
	    .attr("y2", -130);

	an1.select("g.lc")
		.append("circle")
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("r", 4)
		.attr("fill", "darkgrey");

	var an2 = svg
		.append("g")
		.attr("transform", "translate(" + 750 + "," + 400 + ")")
		.attr("class", "annotation")
		.attr("opacity", -1);
	
	an2
		.append("g")
		.attr("transform", "translate(" + 50 + "," + (-130) + ")")
		.attr("class", "rt")
		.append("rect")
		.attr("x", -120)
		.attr("y", 130)
		.attr("width", 160)
		.attr("height", 80)
		.attr("opacity", 0.05)
		.attr("stroke", "lightgrey")
		.attr("stroke-width", 1);

	an2.select("g.rt")
		.append("text")		
		.attr("x", -35)
	    .attr("y", 145)
		.style("fill", "black")
		.attr("opacity", 0.6)
		.attr("text-anchor", "middle");
	
	an2.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "1.1em")
		.text("Number of deaths");

	an2.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "2.2em")
		.text("from COVID-19");

	an2.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "3.3em")
		.text("is increasing");
	an2.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "4.4em")
		.text("as well");

	an2
		.append("g")
		.attr("transform", "translate(" + 10 + "," + 340 + ")")
		.attr("class", "lc")
		.append("line")
		.attr("stroke", "darkgrey")
	    .attr("stroke-width", 1)
	    .attr("stroke-dasharray", "5,5")
	    .attr("x1", 0)
	    .attr("y1", 0)
	    .attr("x2", 0)
	    .attr("y2", -260);

	an2.select("g.lc")
		.append("circle")
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("r", 4)
		.attr("fill", "darkgrey");

	update();

  	function update() {

		cinfo = get_info(countries_info, country_id);

		x.domain([cinfo.min_date, cinfo.max_date]);
		y.domain([0, cinfo.max_cases]);

		svg.select("#x_axis")
		  	.transition()
		    .duration(1000)
		    .call(xAxis);

	  	svg.select("#y_axis")
		    .transition()
		    .duration(1000)
		    .call(yAxis);

	    var slen = width + 500;

	    cpath
			.attr("class", "line")
			//.attr("class", "area")
			.attr("stroke-dashoffset", 0)
			.attr("stroke", "darkblue")
			.attr("stroke-width", "3px")
			.attr("d", cline(data[country_id]));
			//.attr("d", area(data[country_id]));			

		cpath
			.attr("stroke-dasharray", slen+" "+slen)
			.attr("stroke-dashoffset", slen)
			.transition()
	        .duration(1000)
	        .ease(d3.easeLinear)
	        .attr("stroke-dashoffset", 0)
	        .on("end", show_clabel);

	    dpath
			.attr("class", "line")
			.attr("stroke-dashoffset", 0)
			.attr("stroke", "darkred")
			.attr("stroke-width", "3px")
			.attr("d", dline(data[country_id]));

		dpath
			.attr("stroke-dasharray", slen+" "+slen)
			.attr("stroke-dashoffset", slen)		
			.transition()
	        .duration(1000)
	        .ease(d3.easeLinear)
	        .attr("stroke-dashoffset", 0)
	        .on("end", show_dlabel);

    	d3.select("#clabel")
    		.attr("opacity", 0);

    	d3.select("#dlabel")
    		.attr("opacity", 0);

	    function show_clabel() {
	    	d3.select("#clabel")
		    	.attr("transform", "translate("+(width+margin+5)+","+(y(data[country_id][data[country_id].length - 1].cases)+3)+")")
		    	.transition()	    	
		    	.attr("opacity", 1)
		    	.duration(100);
	    }

	    function show_dlabel() {
		    d3.select("#dlabel")
		    	.attr("transform", "translate("+(width+margin+5)+","+(y(data[country_id][data[country_id].length - 1].deaths)+3)+")")
		    	.transition()	    	
		    	.attr("opacity", 1)
		    	.duration(100);
	    }

	    if (country_id == "WD") {
	    	if (an1.attr("opacity") == -1) {
			   	an1
			    	.transition()
			    	.duration(500)
			    	.attr("opacity", 1);
			}
			if (an2.attr("opacity") == -1) {
			    an2
			    	.transition()
			    	.duration(500)
			    	.attr("opacity", 1);
			}
	    } else {
	    	an1
	    		.attr("opacity", 0);
	    	an2
	    		.attr("opacity", 0);
	    }
	}
}

function add_text() {
	var txt = `
	<p>
	<span>
	In most of the countries, the number of confirmed cases and deaths continues to grow, despite the unprecedented measures taken by the states authorities and the international community.
	</span>
	</p>
	<p>
	<span style="font-style: italic;font-size: 0.8em">
	This scene shows detailed information on the dynamics of the number of cases and deaths in the world or in a particular country. The countries are ordered by the total number of cases. Detailed information about the total number of new cases and deaths on particular day appears when chart area is being hovered over.
	</span>
	</p>
	`
	d3.select("#slide_2 div.story").html(txt);
}