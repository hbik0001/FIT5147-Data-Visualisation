document.addEventListener("DOMContentLoaded", function (event) {

    var width = 900,
        height = 800;

    var projection = d3.geo.albersUsa()
        .scale(1280)
        .translate([width / 2, height / 2]),
        path = d3.geo.path()
        .projection(projection);


    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    //var svg = d3.select("body").select(".container").select("#about").select("#pie-graph").append("svg")
    var svg = d3.select("#map-pie").append("svg")
        .attr("id", "us-map")
        .attr("viewBox", "-10 0 960 450")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .style("width", width)
        .style("height", height);

    var svgPie = d3.select("#map-pie").append("svg")
        .attr("id", "pie-graph")
        .attr("viewBox", "-150 -150 300 300")
        .style("width", 500)
        .style("height", 800);

    var years = ["2013", "2014", "2015", "2016", "2017"]
    var case_status = ["CERTIFIED", "CERTIFIED-WITHDRAWN", "DENIED", "WITHDRAWN"]

    updateGraph("2013");
    //updatePie(data);

    d3.select('#filter')
        .on("change", function () {
            var sect = document.getElementById("filter");
            var section = sect.options[sect.selectedIndex].value;
            updateGraph(section)
        });

    function updateGraph(data) {
        var Sampling01 ="https://media.githubusercontent.com/media/hbik0001/FIT5147-Data-Visualisation/master/Final-project/data/Sampling01.csv";
        var states_hash ="https://raw.githubusercontent.com/hbik0001/FIT5147-Data-Visualisation/master/Final-project/data/states-hash.json";
        var us ="https://raw.githubusercontent.com/hbik0001/FIT5147-Data-Visualisation/master/Final-project/data/us.json";
        var HeatMap ="https://media.githubusercontent.com/media/hbik0001/FIT5147-Data-Visualisation/master/Final-project/data/HeatMap.csv";
        queue()
            .defer(d3.json, us)
            .defer(d3.json, states_hash)
            .defer(d3.csv, Sampling01)
            .defer(d3.csv, HeatMap)
            .await(function (err, US, states_hash, emp, sal) {
                _emp = prepare.filterEmp(emp);
                var empGroup = prepare.empGroup(_emp);
                salary = prepare.salary(sal);
                states = prepare.states(states_hash);


                var empCounts = _.mapValues(empGroup, function (empGroup, state) {

                    return salary.get(states.get(state))[data];


                });

                var quantize = d3.scale.quantize()
                    .domain(d3.extent(_.values(empCounts)))
                    .range(d3.range(9).map(function (i) {
                        return "q" + i + "-9-green";
                    }));

                var states = svg.append("g")
                    .attr("class", "states")
                    .selectAll("path")
                    .data(topojson.feature(US, US.objects.states).features)
                    .enter();

                states.append("path")
                    .attr("d", path)
                    .attr("class", function (d) {
                        return quantize(empCounts[stateIdMap.get(d.id)]);
                    });

                states.append("path")
                    .datum(topojson.mesh(US, US.objects.states, function (a, b) {
                        return a !== b;
                    }))
                    .attr("class", "borders")
                    .attr("d", path);

                states.append("text")
                    .text(function (d) {
                        return stateIdMap.get(d.id) || d.id;
                    })
                    .attr({
                        x: function (d) {
                            return path.centroid(d)[0] || 0;
                        },
                        y: function (d) {
                            return path.centroid(d)[1] || 0;
                        },
                    })

                var positions = _emp
                    .map(function (d) {

                        var temp = projection([d.WORKSITE_LONG, d.WORKSITE_LAT])
                        if (temp == null) {
                            temp = [0, 0]
                        }
                        temp.push(d)
                        return temp;
                    })
                    .filter(function (d) {
                        return !!d;
                    });


                svg.append("g")
                    .selectAll("circle")
                    .data(positions)
                    .enter()
                    .append("circle")
                    .attr({
                        cx: function (d) {
                            return d[0];
                        },
                        cy: function (d) {
                            return d[1];
                        },
                        r: function (d) {
                            return ((d[2].PREVAILING_WAGE / 10000) / 2 | 0);


                        },
                        class: "point"
                    })

                    .on("click", function (d) {
                        //alert("on click" + d.className)
                        var selectedCompanyName = d[2].EMPLOYER_NAME;
                        var empComp = prepare.empCompanyName(_emp, selectedCompanyName);
                        var empCaseStatusGroup = prepare.empCaseStatusGroup(empComp);
                        var data = [];
                        var currentCaseStatus = {
                            "label": "",
                            "value": "",
                        };
                        var value = Object.values(empCaseStatusGroup).length;
                        var keys = Object.keys(empCaseStatusGroup);

                        for (var i = 1; i <= keys.length; i++) {
                            var currentCaseStatus = {};
                            currentCaseStatus.label = keys[i - 1]
                            for (var j = 1; j <= 1; j++) {
                                var counts = empCaseStatusGroup[keys[i - 1]].length
                                currentCaseStatus.value = counts;
                                data.push(currentCaseStatus);
                            }
                        }
                        updatePie(data);
                    })

                    .on("mouseover", function (d) {
                        // To change the opacity of the circles when mouse over
                        svg.selectAll("circle")
                            .attr("opacity", 0.5); // grey out all circles
                        d3.select(this) // hightlight the on hovering on
                            .attr("opacity", 10);

                        div.transition()
                            .duration(200)
                            .style("opacity", 10);
                        div.html("<b>Company Name: </b>" + d[2].EMPLOYER_NAME + "<br/>" + "<br/>" +
                                "<b>Job Title: </b>" + d[2].JOB_TITLE + "<br/>" + "<br/>" +
                                "<b>Salary: </b>" + d[2].PREVAILING_WAGE + "$" + "<br/>" + "<br/>")
                            .style("left", (d3.event.pageX + 15) + "px")
                            .style("top", (d3.event.pageY + 15) + "px");

                    })
                    .on("mouseout", function (d) {
                        // For Circle
                        svg.selectAll("circle")
                            .attr("opacity", 10);

                        // For tool tip
                        div.transition()
                            .duration(50)
                            .style("opacity", 0);
                    });


            });

    }

    function updatePie(data) {

        var w = 300, //width
            h = 300, //height
            r = 150, //radius
            color = d3.scale.category20c(); //builtin range of colors

        d3.select("#map-pie").select("svg#pie-graph").select("svg#duplicate-pie").remove();

        var vis = d3.select("#map-pie").select("svg#pie-graph").append("svg")
            .attr("id", "duplicate-pie")
            .data([data]) //associate our data with the document
            .append("g") //make a group to hold our pie chart
            .attr("id", "pie-g");

        var arc = d3.svg.arc() //this will create <path> elements for us using arc data
            .outerRadius(r);

        var pie = d3.layout.pie() //this will create arc data for us given a list of values
            .value(function (d) {
                return d.value;
            }); //we must tell it out to access the value of each element in our data array

        var arcs = vis.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
            .data(pie) //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
            .enter() //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
            .append("svg:g") //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
            .attr("class", "slice"); //allow us to style things in the slices (like text)

        arcs.append("svg:path")
            .attr("id", "pie-path")
            .attr("fill", function (d, i) {
                if (d.data.label == 'CERTIFIED') {
                    return "#2ECC71";
                } else if (d.data.label == 'CERTIFIED-WITHDRAWN') {
                    return "#F7DC6F";
                } else if (d.data.label == 'WITHDRAWN') {
                    return "#5DADE2";
                } else if (d.data.label == 'DENIED') {
                    return "#EC7063";
                }
            }) //set the color for each slice to be chosen from the color function defined above
            .attr("d", arc); //this creates the actual SVG path using the associated data (pie) with the arc drawing function

        arcs.append("svg:text") //add a label to each slice
            .attr("transform", function (d) { //set the label's origin to the center of the arc
                //we have to make sure to set these before calling arc.centroid
                d.innerRadius = 0;
                d.outerRadius = r;
                return "translate(" + arc.centroid(d) + ")"; //this gives us a pair of coordinates like [50, 50]
            })
            .attr("text-anchor", "middle") //center the text on it's origin
            .text(function (d, i) {
                return data[i].label + "-" + data[i].value;
            })
            .style("font-size", "10px");

    }
});
