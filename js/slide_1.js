var geoData;
var cData;
var popData;
var dd_state="cases";
var mdata;

(function () {
    if (mdata === undefined) {
		var promises = [];
	    promises.push(d3.json("data/world.geo.json"));
	    promises.push(d3.csv("data/world.csv"));
	    promises.push(d3.csv("data/API_SP.POP.TOTL_DS2.csv"));
	        
		Promise.all(promises).then(function(values) {
			geoData = values[0];
			cData = values[1];
			popData = values[2];
	
			mdata = {};
			cData.forEach(function(d) {
				try {
					mdata[d[" Country_code"]] = {"cases": +d[" New_cases"], "deaths": +d[" New_deaths"], "iso2": d[" Country_code"]};									
				} catch (error) {
					console.error(error);
				}        
			});

			geoData.features.forEach(function(d) {
				if (mdata[d.properties.iso_a2] != undefined) {
					mdata[d.properties.iso_a2]["iso3"] = d.properties.iso_a3;
					mdata[d.properties.iso_a2]["name"] = d.properties.name_long;
				}
			});

			popData.forEach(function(d) {
				var kres;
				for (var key in mdata) {					
					if (mdata[key].iso3 == d["Country Code"]) {
						kres = key;
						break;
					}
				}

				if (kres !== undefined) {
					mdata[kres]["population"] = +d["2019"];
				}				
			});

			// for (var key in mdata) {
			// 	mdata[mdata[key].iso3] = mdata[key];
			// }

			drawChart(mdata, dd_state);
			add_text();
		});
	}  	
})();

function get_sorted_countries(mdata, dd_state) {
	res = {};
	int_number = 5;

	if (dd_state == "cases") {
		max_v = d3.max(Object.values(mdata), function(d) { return d.cases; });
	} else {
		max_v = d3.max(Object.values(mdata), function(d) { return d.deaths; });
	}

	//var step = (max_v/int_number)**(0.2*0);
	c_pos = 0;
	for (var i = 1; i <= int_number; i++) {
		step = (max_v/int_number)**(0.25*i);
		res[i-1] = new Array();
		for (var key in mdata) {
			if (dd_state == "cases") {
				if ((mdata[key].cases >= c_pos) && (mdata[key].cases <= (c_pos+step))) {
					res[i-1].push(key);
				}
			} else {
				if ((mdata[key].deaths >= c_pos) && (mdata[key].deaths <= (c_pos+step))) {
					res[i-1].push(key);
				}
			}
		}
		c_pos += step;
	}

	// console.log(res);
	// return;

	return res;
}

function updateMap(mdata, dd_state) {
	d3.select("#map").select("svg").selectAll("*").remove();

	drawChart(mdata, dd_state);      
}

function drawChart(mdata) {
	var slide_ind = 1;

	d3.select("#dropdown")
		.insert("select", ":first-child")
		.on("change", function(d) {
			dd_state = d3.select(this).property("value");
			update(mdata, dd_state);
		})
		.selectAll('option')
		.data(["cases", "deaths"])
		.enter()
		.append('option')
			.text(function (d) { return d; })
			.attr("value", function (d) { return d; });

	var svg = d3.select(`#slide_${slide_ind}`).select(".chart").select("svg");

    var margin = 50;
    var width = +svg.attr("width");
    var height = +svg.attr("height");
    
    var proj = d3.geoMercator()
      .center([0, 50])
      .scale(180)
      .translate([width/2, height/2]);

    var build_path = d3.geoPath(proj);

	svg
		.append("g")
		.attr("transform", "translate(" + 0 + "," + (-margin/2) + ")")
		.attr("id", "map-paths")
		.selectAll("path")
		.data(geoData.features)
		.enter()
		.append("path").attr("d", function(feature) { return build_path(feature) })
		.attr("opacity", 0.6)
		.attr("stroke", "white")
		.attr("stroke-width", "0.7px")
		.on("mouseover", function(d) {
			d3.select(this)
				.attr("stroke-width", "1px")
				.attr("stroke", "black")
			d3.select("div#info")
				.transition()
				.duration(250)
				.style("opacity", 0.7);
			
			var tooltip;
			if (d.properties.iso_a2 in mdata) {
				tooltip = `
					<span><b>${mdata[d.properties.iso_a2].name}</b></span></br>
					<span>Number of cases: ${mdata[d.properties.iso_a2].cases}</span></br>
					<span>Number of deaths: ${mdata[d.properties.iso_a2].deaths}</span></br>
					<span>Population: ${mdata[d.properties.iso_a2].population}</span></br>            
				`;
			} else {
				tooltip = `
					<span>No data<span>
				`;
			}

			d3.select("div#info").html(tooltip)
				.style("left", d3.event.pageX+"px")	
				.style("top", d3.event.pageY-4*margin+"px");
		})
		.on("mouseout", function(d) { 
			//d3.select(this).classed("selected", false);
			d3.select(this)
				.attr("stroke-width", "0.7px")
				.attr("stroke", "white");

			d3.select("#info").transition()
				.style("opacity", 0);
		});

	svg
		.append("g")
		.attr("transform", "translate(" + (width/2-2*margin) + "," + (height-margin) + ")")
		.attr("id", "color-ribbon")
		.selectAll("rect")
		.data([0,1,2,3,4])
		.enter()
		.append("rect")
		.attr("x", function(d,i) { return i*margin; })
		.attr("y", 0)
		.attr("stroke", "white")
		.attr("width", margin)
		.attr("height", margin/3);

	var an1 = svg
		.append("g")
		.attr("transform", "translate(" + 380 + "," + 420 + ")")
		.attr("class", "annotation")
		.attr("opacity", -1);
	
	an1
		.append("g")
		.attr("transform", "translate(" + 0 + "," + 0 + ")")
		.attr("class", "rt")
		.append("rect")
		.attr("x", -120)
		.attr("y", 130)
		.attr("width", 160)
		.attr("height", 85)
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
		.text("The United States");

	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "2.2em")
		.text("is leading the world");

	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "3.3em")
		.text("in the number of");

	an1.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "4.4em")
		.text("COVID-19 deaths");

	an1
		.append("g")
		.attr("transform", "translate(" + 0 + "," + 0 + ")")
		.attr("class", "lc")
		.append("line")
		.attr("stroke", "darkgrey")
	    .attr("stroke-width", 1)
	    .attr("stroke-dasharray", "5,5")
	    .attr("x1", 0)
	    .attr("y1", 0)
	    .attr("x2", 0)
	    .attr("y2", 130);

	an1.select("g.lc")
		.append("circle")
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("r", 4)
		.attr("fill", "darkgrey");

	var an2 = svg
		.append("g")
		.attr("transform", "translate(" + 1040 + "," + 450 + ")")
		.attr("class", "annotation")
		.attr("opacity", -1);

	an2
		.append("g")
		.attr("transform", "translate(" + 245 + "," + (-170) + ")")
		.attr("class", "rt")
		.append("rect")
		.attr("x", -120)
		.attr("y", 130)
		.attr("width", 160)
		.attr("height", 85)
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
		.text("The first case of");

	an2.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "2.2em")
		.text("the coronavirus");

	an2.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "3.3em")
		.text("was reported in");

	an2.select("g.rt").select("text")
		.append("tspan")
		.attr("x", -40)
		.attr("y", 130)
		.attr("dy", "4.4em")
		.text("Wuhan, China");

	an2
		.append("g")
		.attr("transform", "translate(" + 0 + "," + 0 + ")")
		.attr("class", "lc")
		.append("line")
		.attr("stroke", "darkgrey")
	    .attr("stroke-width", 1)
	    .attr("stroke-dasharray", "5,5")
	    .attr("x1", 0)
	    .attr("y1", 0)
	    .attr("x2", 130)
	    .attr("y2", 0);

	an2.select("g.lc")
		.append("circle")
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("r", 4)
		.attr("fill", "darkgrey");


    update(mdata, dd_state);
    
    function update(mdata, dd_state) { 
    	var s_countries = get_sorted_countries(mdata, dd_state);    	

		if (dd_state == "cases") {
			max_y = d3.max(Object.values(mdata), function(d) { return d.cases; });
			var color = d3.scaleSymlog()
				.domain([0, max_y])
				.range(["lightgrey", "darkblue"]);
		} else {
			max_y = d3.max(Object.values(mdata), function(d) { return d.deaths; });
			var color = d3.scaleSymlog() 
				.domain([0, max_y])
				.range(["lightgrey", "darkred"]);
		}
        
        d3.select("#map-paths").selectAll("path")
        	.transition()
        	.duration(500)
	    	.attr("fill", function(d,i) { 
				if (d.properties.iso_a2 in mdata) {
					if (dd_state == "cases") {
						return color(mdata[d.properties.iso_a2].cases); 
					} else {
						return color(mdata[d.properties.iso_a2].deaths); 
					}
				} else { 
					return "lightgrey" 
				} 
			});

	    d3.select("#color-ribbon").selectAll("rect")
	    	.data([0,1,2,3,4]) //
	    	.attr("fill", function(d,i) { return color(((max_y / 5)/2)**(0.25*i)); })
	    	.on("mouseover", function(i) {
	    		d3.select("#map-paths").selectAll("path")
	    			.attr("fill", function(d) {
	    				if (s_countries[i].includes(d.properties.iso_a2)) {	    					
	    					return color(mdata[d.properties.iso_a2].cases); 
	    				}
	    				return "lightgrey";	    				    					    			
    				});
	    	})
	    	.on("mouseout", function() {
	    		d3.select("#map-paths").selectAll("path")
	    		.attr("fill", function(d,i) { 
	    		if (d.properties.iso_a2 in mdata) {
					if (dd_state == "cases") {
						return color(mdata[d.properties.iso_a2].cases); 
					} else {
						return color(mdata[d.properties.iso_a2].deaths); 
					}
				} else { 
					return "lightgrey" 
				}
	    	});
	    });

	    if (dd_state == "cases") {
	    	if (an2.attr("opacity") == -1) {
			    an2
			    	.transition()
			    	.duration(500)
			    	.attr("opacity", 1);
			}
			if (an1.attr("opacity") == 1) {
				an1
		    	 	.transition()
			     	.duration(500)
		    	 	.attr("opacity", 0);
			}
	    } else {
	    	if (an1.attr("opacity") == -1) {
		    	an1
			    	.transition()
			    	.duration(500)
			    	.attr("opacity", 1);
			}
			if (an2.attr("opacity") == 1) {
				an2
		    	 	.transition()
			     	.duration(500)
		    	 	.attr("opacity", 0);
			}
	    }
    }
}

function add_text() {
	var txt = `
	<p>
	<span>
	The coronavirus has spread rapidly across the Planet since the first confirmed case. And now there are almost no countries left where there would be no confirmed cases of COVID-19.
	</span>
	</p>
	<p>
	<span style="font-style: italic;font-size: 0.8em">
	This scene shows the situation with coronavirus on a global scale in terms of the total number of cases and deaths. Detailed information is provided by hovering over a specific country. The countries might be filtered out according to a range of cases/deaths by hovering over the color map. The drop-down menu in the upper right corner allows to switch the view(cases/deaths).
	</span>
	</p>
	`
	d3.select("#slide_1 div.story").html(txt);
}