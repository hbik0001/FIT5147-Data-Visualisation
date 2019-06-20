var stateIdMap = d3.map({
        1: "AL",
        2: "AK",
        4: "AZ",
        5: "AR",
        6: "CA",
        8: "CO",
        9: "CT",
        10: "DE",
        11: "DC",
        12: "FL",
        13: "GA",
        15: "HI",
        16: "ID",
        17: "IL",
        18: "IN",
        19: "IA",
        20: "KS",
        21: "KY",
        22: "LA",
        23: "ME",
        24: "MD",
        25: "MA",
        26: "MI",
        27: "MN",
        28: "MS",
        29: "MO",
        30: "MT",
        31: "NE",
        32: "NV",
        33: "NH",
        34: "NJ",
        35: "NM",
        36: "NY",
        37: "NC",
        38: "ND",
        39: "OH",
        40: "OK",
        41: "OR",
        42: "PA",
        44: "RI",
        45: "SC",
        46: "SD",
        47: "TN",
        48: "TX",
        49: "UT",
        50: "VT",
        51: "VA",
        53: "WA",
        54: "WV",
        55: "WI",
        56: "WY"
    }),
    knownStates = _.sortBy(stateIdMap.values());

var prepare = {

    filterEmp: function (employee) {
        return employee
            .filter(function (emp) {
                return !!emp.WORKSITE_STATE;
            })
            .filter(function (emp) {
                return _.indexOf(knownStates, emp.WORKSITE_STATE, true) >= 0;
            });
    },
    empJobYearFilter: function (employee, year) {
        return employee
            .filter(function (emp) {
                return !!emp.PW_SOURCE_YEAR;
            })
            .filter(function (emp) {
                return emp.PW_SOURCE_YEAR == year ;
            });
    },

    empCompanyName: function (employee, comp) {
        //console.log(index);
        return employee.filter(function (emp) {
            return emp.EMPLOYER_NAME.toLowerCase() == comp.toLowerCase()
        });
    },

    empJobName: function (employee, job) {
        //console.log(index);
        return employee.filter(function (emp) {
            return emp.JOB_TITLE.toLowerCase() == job.toLowerCase()
        });
    },

    empGroup: function (employee) {
        return _.groupBy(employee,
            function (emp) {
                return emp.WORKSITE_STATE;
            });
    },

    empCaseStatusGroup: function (employee) {
        return _.groupBy(employee,
            function (emp) {
                return emp.CASE_STATUS;
            });
    },

    states: function (states) {
        return d3.map(_.mapValues(states,
            function (s) {
                return s.toLowerCase();
            }));
    },

    salary: function (salary) {
        return d3.map(_.zipObject(
            salary.map(function (s) {
                return s.State.toLowerCase();
            }),
            salary.map(function (s) {
                var years = [2013, 2014, 2015, 2016, 2017];
                return _.zipObject(years,
                    years.map(function (y) {
                        return Number(s[y]);
                    }));
            })));
    }
};
