document.addEventListener("DOMContentLoaded", function (event) {
    var final_filtered_year = "https://media.githubusercontent.com/media/hbik0001/FIT5147-Data-Visualisation/master/Final-project/data/final_filtered-year.csv";
    d3.csv(final_filtered_year, function (d) {

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


        var empComp = prepare.empCompanyName(d, 'ACCENTURE LLP');
        updateRadial(empComp);

        // Handler for dropdown value change
        var dropdownChange = function () {
            var newCompany = d3.select(this).property('value')
            var empComp = prepare.empCompanyName(d, newCompany);
            updateRadial(empComp);
        };

        //Get names of cereals, for dropdown
        var companys = Object.keys(companyMap).sort();

        var dropdown = d3.select("#vis-container")
            .insert("select", "svg")
            .on("change", dropdownChange);

        dropdown.selectAll("option")
            .data(companys)
            .enter().append("option")
            .attr("value", function (dd) {
                return dd;
            })
            .text(function (dd) {
                return dd;
            });
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

            var diameter = 800;

            var margin = {
                    top: 20,
                    right: 120,
                    bottom: 20,
                    left: 120
                },
                width = diameter,
                height = 750;

            var i = 0,
                duration = 1500,
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

            d3.select("#radial-line").select("svg#radial-tree").remove();

            var svgTree = d3.select("#radial-line")
                .append("svg")
                .attr("id", "radial-tree")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("id", "g-radial")
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

                    d3.select("#radial-line").select("svg#radial-tree").select("g#g-radial").append("text")
                        .attr({
                            id: "t" + "-" + i
                        })
                        .text(function () {
                            return (d.name); // Value of the text
                        })
                        .style("stroke", "white");
                }

                function handleMouseOut(d, i) {
                    d3.select("#radial-line").select("svg#radial-tree").select("g#g-radial")
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
                //console.log(d);
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
                    var empJob = prepare.empJobName(_emp, selectedJobName);
                    // console.log(empJob);
                    var lineData = [];
                    var currentCaseStatus = {
                        "state": "",
                        "value": "",
                        "year": "",
                    };
                    for (var k = 2013; k <= 2017; k++) {
                        var empJobYearFilter = prepare.empJobYearFilter(empJob, k);
                        var empCaseStatusGroup = prepare.empCaseStatusGroup(empJobYearFilter);
                        // console.log(empCaseStatusGroup);
                        var value = Object.values(empCaseStatusGroup).length;
                        var keys = Object.keys(empCaseStatusGroup);

                        for (var i = 1; i <= keys.length; i++) {
                            var currentCaseStatus = {};
                            currentCaseStatus.state = keys[i - 1]
                            for (var j = 1; j <= 1; j++) {
                                var counts = empCaseStatusGroup[keys[i - 1]].length
                                currentCaseStatus.value = counts;
                                currentCaseStatus.year = k;
                                lineData.push(currentCaseStatus);
                            }
                        }

                    }

                    //console.log("data here");
                    //console.log(lineData);
                    updateLine(lineData);
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
        }


        // Line Graph starts
        function updateLine(lineData) {
            function filterJSON(json, key, value) {
                var result = [];
                json.forEach(function (val, idx, arr) {
                    if (val[key] == value) {

                        result.push(val)
                    }
                })
                return result;
            }

            // Set the dimensions of the canvas / graph
            var margin = {
                    top: 50,
                    right: 20,
                    bottom: 30,
                    left: 600
                },
                width = 500,
                height = 500,
                padding = 100;

            //Parsing Year

            //var format = d3.time.format("%Y-%m-%d"");
            //console.log(format.parse("2011")); // returns a Date
            //console.log(format(new Date(2011))); // returns a string         


            // Set the ranges
            var x = d3.time.scale().range([0, width]);
            var y = d3.scale.linear().range([height, 0]);

            // Define the axes
            var xAxis = d3.svg.axis().scale(x)
                .orient("bottom").ticks(5)
                .tickFormat(d3.time.format("%Y"));


            var yAxis = d3.svg.axis().scale(y)
                .orient("left").ticks(5);

            // Define the line
            var stateline = d3.svg.line()
                .interpolate("cardinal")
                .x(function (d) {
                    console.log("x(ParseYear(d.year))");
                    return x(new Date(d.year));
                })
                .y(function (d) {
                    return y(d.value);
                });

            d3.select("#radial-line").select("svg#svg-line").remove();

            // Adds the svg canvas
            var svg1 = d3.select("#radial-line").append("svg")
                .attr("id", "svg-line")
                .attr("viewBox", "-250 -75 800 500")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .style("width", "650px")
                .style("height", "750px");

            lineData.forEach(function (d) {
                d.value = +d.value;
            });

            //debugger

            lineData.forEach(function (d) {
                d.value = +d.value;
                //d.year = parseDate(String(d.year));
                d.active = true;
            });


            //debugger
            updateGraph(lineData);

            //-------------------------------------------------------------------------------

            function updateGraph(data) {


                // Scale the range of the data
                x.domain(d3.extent(data, function (d) {
                    return d.year;
                }));
                y.domain([d3.min(data, function (d) {
                    return d.value;
                }), d3.max(data, function (d) {
                    return d.value;
                })]);


                // Nest the entries by state
                dataNest = d3.nest()
                    .key(function (d) {
                        return d.state;
                    })
                    .entries(data);


                var result = dataNest.filter(function (val, idx, arr) {
                    return $("." + val.key).attr("fill") != "#ccc"
                    // matching the data with selector status
                })


                var state = svg1.selectAll(".line")
                    .data(result, function (d) {
                        return d.key
                    });

                state.enter().append("path")
                    .attr("class", "line");

                state.transition()
                    .style("stroke", function (d, i) {
                        if (d.key == 'CERTIFIED') {
                            return "#2ECC71";
                        } else if (d.key == 'CERTIFIED-WITHDRAWN') {
                            return "#F7DC6F";
                        } else if (d.key == 'WITHDRAWN') {
                            return "#5DADE2";
                        } else if (d.key == 'DENIED') {
                            return "#EC7063";
                        }
                    })
                    .attr("id", function (d) {
                        return 'tag' + d.key.replace(/\s+/g, '');
                    }) // assign ID
                    .attr("d", function (d) {
                        return stateline(d.values)
                    });

                state.exit().remove();

                var legend = d3.select("#legend")
                    .selectAll("text")
                    .data(dataNest, function (d) {
                        return d.key
                    });

                //checkboxes
                legend.enter().append("rect")
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("x", 0)
                    .attr("y", function (d, i) {
                        return 0 + i * 15;
                    }) // spacing
                    .attr("fill", function (d) {
                        if (d.key == 'CERTIFIED') {
                            return "#2ECC71";
                        } else if (d.key == 'CERTIFIED-WITHDRAWN') {
                            return "#F7DC6F";
                        } else if (d.key == 'WITHDRAWN') {
                            return "#5DADE2";
                        } else if (d.key == 'DENIED') {
                            return "#EC7063";
                        }

                    })
                    .attr("class", function (d, i) {
                        return "legendcheckbox " + d.key
                    })
                    .on("click", function (d) {
                        d.active = !d.active;

                        d3.select(this).attr("fill", function (d) {
                            if (d3.select(this).attr("fill") == "#ccc") {
                                if (d.key == 'CERTIFIED') {
                                    return "#2ECC71";
                                } else if (d.key == 'CERTIFIED-WITHDRAWN') {
                                    return "#F7DC6F";
                                } else if (d.key == 'WITHDRAWN') {
                                    return "#5DADE2";
                                } else if (d.key == 'DENIED') {
                                    return "#EC7063";
                                }
                            } else {
                                return "#ccc";
                            }
                        })


                        var result = dataNest.filter(function (val, idx, arr) {
                            return $("." + val.key).attr("fill") != "#ccc"
                            // matching the data with selector status
                        })

                        // Hide or show the lines based on the ID
                        svg1.selectAll(".line").data(result, function (d) {
                                return d.key
                            })
                            .enter()
                            .append("path")
                            .attr("class", "line")
                            .style("stroke", function (d, i) {
                                return d.color = color(d.key);
                            })
                            .attr("d", function (d) {
                                return stateline(d.values);
                            });

                        svg1.selectAll(".line").data(result, function (d) {
                            return d.key
                        }).exit().remove()

                    })

                // Add the Legend text
                legend.enter().append("text")
                    .attr("x", 15)
                    .attr("y", function (d, i) {
                        return 10 + i * 50;
                    })
                    .attr("class", "legend");

                legend.transition()
                    .style("fill", "#777")
                    .text(function (d) {
                        return d.key;
                    });

                legend.exit().remove();

                svg1.selectAll(".axis").remove();

                // Add the X Axis
                svg1.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                // Add the Y Axis
                svg1.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);
            };
        }
    });

});
