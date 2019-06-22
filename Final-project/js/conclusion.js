document.addEventListener("DOMContentLoaded", function (event) {


    // Map start

    var width = 650,
        height = 550;

    var projection = d3.geo.albersUsa()
        .scale(900)
        .translate([width / 2, height / 2]),
        path = d3.geo.path()
        .projection(projection);


    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    //var svg = d3.select("body").select(".container").select("#about").select("#pie-graph").append("svg")
    var svg = d3.select("#map-radial-c").append("svg")
        .attr("id", "us-map-c")
        .attr("viewBox", "-50 -50 650 650")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .style("width", width)
        .style("height", height);

    var years = ["2013", "2014", "2015", "2016", "2017"]
    var case_status = ["CERTIFIED", "CERTIFIED-WITHDRAWN", "DENIED", "WITHDRAWN"]

    updateGraph("2017");
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
                            //console.log((d[2].PREVAILING_WAGE / 10000)/2 | 0);

                            return ((d[2].PREVAILING_WAGE / 10000) / 2 | 0);


                        },
                        class: "point"
                    })

                    .on("click", function (d) {
                        var selectedCompanyName = d[2].EMPLOYER_NAME;
                        console.log("Selected Company Name:", d[2].EMPLOYER_NAME);
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
                        console.log("updateRadialTree- Company Name:");
                        updateRadialTree(selectedCompanyName);
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




        //--------------------------------------Radial-----------------------------------------------------------------

        function updateRadialTree(selComp) {
            var final_filtered_year = "https://media.githubusercontent.com/media/hbik0001/FIT5147-Data-Visualisation/master/Final-project/data/final_filtered-year.csv";
            d3.csv(final_filtered - year, function (d) {

                var years = ["2013", "2014", "2015", "2016", "2017"]

                var _emp = d;

                var companyMap = {};
                d.forEach(function (d) {
                    var company = d.EMPLOYER_NAME;
                    companyMap[company] = [];

                    years.forEach(function (field) {
                        companyMap[company].push(+d[field]);
                    });
                });


                var selEmpCompany = prepare.empCompanyName(d, selComp);
                updateRadial(selEmpCompany);

                //--------------------------------------------------------------------------------------------
                // Radial graph Starts
                function updateRadial(empComp) {
                    var groupData = _.groupBy(empComp, function (obj) {
                        return obj.EMPLOYER_NAME + "###" + obj.SOC_NAME + "###" + obj.JOB_TITLE
                    });

                    var graphData = [];
                    var currentGrandParent = {
                        name: undefined,
                        children: [],
                    };
                    var currentParent = {
                        name: undefined,
                        children: [],
                    };
                    var sorted_keys = Object.keys(groupData).sort()
                    _.each(sorted_keys, function (groupKey) {

                        var jobTitleData = groupData[groupKey]
                        var currentChild = {
                            name: jobTitleData[0].JOB_TITLE,
                            value: jobTitleData.length
                        }

                        if (jobTitleData[0].EMPLOYER_NAME == currentGrandParent.name) {

                            if (jobTitleData[0].SOC_NAME == currentParent.name) {
                                currentParent.children.push(currentChild)
                            } else {

                                if (currentParent.name != undefined) {
                                    currentGrandParent.children.push(currentParent)
                                }
                                currentParent = {}
                                currentParent.name = jobTitleData[0].SOC_NAME
                                currentParent.children = [currentChild]
                            }

                        } else {

                            if (currentGrandParent.name != undefined) {
                                currentGrandParent.children.push(currentParent)
                                graphData.push(currentGrandParent)
                            }

                            currentChild = {}
                            currentChild.name = jobTitleData[0].JOB_TITLE
                            currentChild.value = jobTitleData.length

                            currentParent = {}
                            currentParent.name = jobTitleData[0].SOC_NAME
                            currentParent.children = [currentChild]

                            currentGrandParent = {}
                            currentGrandParent.name = jobTitleData[0].EMPLOYER_NAME
                            currentGrandParent.children = [currentParent]
                            graphData.push(currentGrandParent)
                        }

                    });


                    var MainParent = {
                        name: "CompanyName",
                        children: graphData,
                    };

                    var diameter = 400;

                    var margin = {
                            top: 20,
                            right: 120,
                            bottom: 20,
                            left: 120
                        },
                        width = diameter,
                        height = 300;

                    var i = 0,
                        duration = 500,
                        root;

                    var tree = d3.layout.tree()
                        .size([360, diameter / 2 - 80])
                        .separation(function (a, b) {
                            return (a.parent == b.parent ? 1 : 10) / a.depth;
                        });

                    var diagonal = d3.svg.diagonal.radial()
                        .projection(function (d) {
                            return [d.y, d.x / 180 * Math.PI];
                        });

                    d3.select("#map-radial-c").select("svg#radial-tree-c").remove();

                    var svgTree = d3.select("#map-radial-c")
                        .append("svg")
                        .attr("preserveAspectRatio", "xMinYMin meet")
                        .attr("id", "radial-tree-c")
                        .attr("width", width)
                        .attr("height", height)
                        .append("g")
                        .attr("id", "g-radial-c")
                        .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

                    root = MainParent.children[0];
                    root.x0 = height / 2;
                    root.y0 = 0;

                    //root.children.forEach(collapse); // start with all children collapsed
                    update(root);

                    d3.select(self.frameElement).style("height", "1000px");

                    function update(source) {

                        // Compute the new tree layout.
                        var nodes = tree.nodes(root),
                            links = tree.links(nodes);

                        var circleAttrs = {
                            x: function (d) {
                                return 180
                            },
                            dy: function (d) {
                                return "1.2em"
                            },
                        };

                        // Normalize for fixed-depth.
                        nodes.forEach(function (d) {
                            var lineLength = 1;
                            if (typeof (d.children) == "undefined") {
                                lineLength == 1;
                            } else {
                                lineLength = d.children.length;
                            }
                            d.y = d.depth * 80 + lineLength * 10;
                        });

                        // Update the nodes…
                        var node = svgTree.selectAll("g.node")
                            .data(nodes, function (d) {
                                return d.id || (d.id = ++i);
                            });


                        // Create Event Handlers for mouse
                        function handleMouseOver(d, i) { // Add interactivity

                            d3.select("#map-radial-c").select("svg#radial-tree-c").select("g#g-radial-c").append("text")
                                .attr({
                                    id: "t" + "-" + i
                                })
                                .text(function () {
                                    return (d.name); // Value of the text
                                })
                                .style("stroke", "white");
                        }

                        function handleMouseOut(d, i) {
                            d3.select("#map-radial-c").select("svg#radial-tree-c").select("g#g-radial-c")
                                .select("#t-" + i).remove();
                        }

                        // Enter any new nodes at the parent's previous position.
                        var nodeEnter = node.enter().append("g")
                            .attr("class", "node")
                            //.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
                            .on("click", click);



                        nodeEnter.append("circle")
                            .attr("r", 100)
                            .style("fill", function (d) {
                                return d._children ? "lightsteelblue" : "#fff"
                            })
                            .on("mouseover", handleMouseOver)
                            .on("mouseout", handleMouseOut);



                        // Transition nodes to their new position.
                        var nodeUpdate = node.transition()
                            .duration(duration)
                            .attr("transform", function (d) {
                                return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                            })

                        nodeUpdate.select("circle")
                            .attr("r", function (d) {
                                if (d.value == undefined) {
                                    return 5;
                                } else if (d.value > 10) {
                                    return 20;
                                } else {
                                    return d.value * 2;
                                }

                            })
                            .style("fill", function (d) {
                                return d._children ? "lightsteelblue" : "#fff";
                            });

                        nodeUpdate.select("text")
                            .style("fill-opacity", 1)
                            .attr("transform", function (d) {
                                return d.x < 180 ? "translate(0)" : "rotate(180)translate(-" + (d.name.length + 50) + ")";
                            });

                        // TODO: appropriate transform
                        var nodeExit = node.exit().transition()
                            .duration(duration)
                            .attr("transform", function (d) {
                                return "diagonal(" + source.y + "," + source.x + ")";
                            })
                            .remove();

                        nodeExit.select("circle")
                            .attr("r", 1e-6);

                        nodeExit.select("text")
                            .style("fill-opacity", 1e-6);

                        // Update the links…
                        var link = svgTree.selectAll("path.link")
                            .data(links, function (d) {
                                return d.target.id;
                            });

                        // Enter any new links at the parent's previous position.
                        link.enter().insert("path", "g")
                            .attr("class", "link")
                            .attr("d", function (d) {
                                var o = {
                                    x: source.x0,
                                    y: source.y0
                                };
                                return diagonal({
                                    source: o,
                                    target: o
                                });
                            });

                        // Transition links to their new position.
                        link.transition()
                            .duration(duration)
                            .attr("d", diagonal);

                        // Transition exiting nodes to the parent's new position.
                        link.exit().transition()
                            .duration(duration)
                            .attr("d", function (d) {
                                var o = {
                                    x: source.x,
                                    y: source.y
                                };
                                return diagonal({
                                    source: o,
                                    target: o
                                });
                            })
                            .remove();

                        // Stash the old positions for transition.
                        nodes.forEach(function (d) {
                            d.x0 = d.x;
                            d.y0 = d.y;
                        });
                    }

                    // Toggle children on click.
                    function click(d) {
                        console.log(d);
                        //                console.log(d.name);
                        //                console.log(d.parent.name);
                        //                console.log(d.parent.parent.name);
                        if (d.children) {
                            d._children = d.children;
                            d.children = null;
                        } else {
                            d.children = d._children;
                            d._children = null;
                        }

                        update(d);
                        // update Line
                        if (d.parent.name != undefined || d.name != undefined) {
                            var selectedJobName = d.name;
                            console.log("selectedJobName:", selectedJobName);
                            var empJob = prepare.empJobName(_emp, selectedJobName);
                            console.log(empJob);
                            var lineData = [];
                            var valuePlaceHolder = {
                                "value": undefined, // count
                                "rate": undefined, // case status
                            };
                            var currentCaseStatus = {
                                "categorie": undefined,
                                "values": [],
                            };
                            for (var k = 2013; k <= 2017; k++) {
                                var empJobYearFilter = prepare.empJobYearFilter(empJob, k);
                                var empCaseStatusGroup = prepare.empCaseStatusGroup(empJobYearFilter);
                                console.log(empCaseStatusGroup);
                                var value = Object.values(empCaseStatusGroup).length;
                                var keys = Object.keys(empCaseStatusGroup);

                                currentCaseStatus = {};
                                currentCaseStatus.values = [];
                                currentCaseStatus.categorie = k;

                                for (var i = 1; i <= keys.length; i++) {
                                    for (var j = 1; j <= 1; j++) {
                                        var counts = empCaseStatusGroup[keys[i - 1]].length
                                        valuePlaceHolder = {};

                                        valuePlaceHolder.value = counts;
                                        valuePlaceHolder.rate = keys[i - 1];
                                        console.log(currentCaseStatus);
                                        console.log(valuePlaceHolder);
                                        currentCaseStatus.values.push(valuePlaceHolder);
                                    }
                                }
                                lineData.push(currentCaseStatus);
                            }

                            console.log("data here");
                            console.log(lineData);

                            updateBarChart(lineData);
                        }

                    }

                    // Collapse nodes
                    function collapse(d) {
                        if (d.children) {
                            d._children = d.children;
                            d._children.forEach(collapse);
                            d.children = null;
                        }
                    }
                    //----------------- Bar Graph-------------------------------------------------------

                    function updateBarChart(barData) {

                        var margins = {
                                top: 20,
                                right: 20,
                                bottom: 30,
                                left: 40
                            },
                            width = 960 - margins.left - margins.right,
                            height = 500 - margins.top - margins.bottom;

                        var x0 = d3.scale.ordinal()
                            .rangeRoundBands([0, width], .1);

                        var x1 = d3.scale.ordinal();

                        var y = d3.scale.linear()
                            .range([height, 0]);

                        var xAxis = d3.svg.axis()
                            .scale(x0)
                            .tickSize(0)
                            .orient("bottom");

                        var yAxis = d3.svg.axis()
                            .scale(y)
                            .orient("left");

                        var color = d3.scale.ordinal()
                            .range(["#ca0020", "#f4a582", "#d5d5d5", "#92c5de", "#0571b0"]);

                        var svgBar = d3.select("#bar-c").select("svg#svg-bar-c")
                            .attr("width", width + margins.left + margins.right)
                            .attr("height", height + margins.top + margins.bottom)
                            .append("g")
                            .attr("id", "g-bar-c")
                            .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

                        updateStackBarCharts(barData);

                        function updateStackBarCharts(data) {

                            var categoriesNames = data.map(function (d) {
                                return d.categorie;
                            });
                            var rateNames = data[0].values.map(function (d) {
                                return d.rate;
                            });

                            x0.domain(categoriesNames);
                            x1.domain(rateNames).rangeRoundBands([0, x0.rangeBand()]);
                            y.domain([0, d3.max(data, function (categorie) {
                                return d3.max(categorie.values, function (d) {
                                    return d.value;
                                });
                            })]);

                            svgBar.append("g")
                                .attr("class", "x axis-bar")
                                .attr("transform", "translate(0," + height + ")")
                                .call(xAxis);

                            svgBar.append("g")
                                .attr("class", "y axis-bar")
                                .style('opacity', '0')
                                .call(yAxis)
                                .append("text")
                                .attr("transform", "rotate(-90)")
                                .attr("y", 6)
                                .attr("dy", ".71em")
                                .style("text-anchor", "end")
                                .style('font-weight', 'bold')
                                .text("No of Employee");

                            svgBar.select('.y').transition().duration(500).delay(1300).style('opacity', '1');

                            var slice = svgBar.selectAll(".slice")
                                .data(data)
                                .enter().append("g")
                                .attr("id", "g-bar-id-c")
                                .attr("class", "g-bar-c")
                                .attr("transform", function (d) {
                                    return "translate(" + x0(d.categorie) + ",0)";
                                });

                            slice.selectAll("rect")
                                .data(function (d) {
                                    return d.values;
                                })
                                .enter().append("rect")
                                .attr("width", x1.rangeBand())
                                .attr("x", function (d) {
                                    return x1(d.rate);
                                })
                                .style("fill", function (d) {
                                    return color(d.rate)
                                })
                                .attr("y", function (d) {
                                    return y(0);
                                })
                                .attr("height", function (d) {
                                    return height - y(0);
                                })
                                .on("mouseover", function (d) {
                                    d3.select(this).style("fill", d3.rgb(color(d.rate)).darker(2));
                                })
                                .on("mouseout", function (d) {
                                    d3.select(this).style("fill", color(d.rate));
                                });

                            slice.selectAll("rect")
                                .transition()
                                .delay(function (d) {
                                    return Math.random() * 1000;
                                })
                                .duration(1000)
                                .attr("y", function (d) {
                                    return y(d.value);
                                })
                                .attr("height", function (d) {
                                    return height - y(d.value);
                                });

                            //Legend
                            var legend = svg.selectAll(".legend")
                                .data(data[0].values.map(function (d) {
                                    return d.rate;
                                }).reverse())
                                .enter().append("g")
                                .attr("class", "legend")
                                .attr("transform", function (d, i) {
                                    return "translate(0," + i * 20 + ")";
                                })
                                .style("opacity", "0");

                            legend.append("rect")
                                .attr("x", width - 18)
                                .attr("width", 18)
                                .attr("height", 18)
                                .style("fill", function (d) {
                                    return color(d);
                                });

                            legend.append("text")
                                .attr("x", width - 24)
                                .attr("y", 9)
                                .attr("dy", ".35em")
                                .style("text-anchor", "end")
                                .text(function (d) {
                                    return d;
                                });

                            legend.transition().duration(500).delay(function (d, i) {
                                return 1300 + 100 * i;
                            }).style("opacity", "1");

                        };


                    };


                    //----------------------------Bar End--------------------------------------------------


                }


            });
        }
    }
});
