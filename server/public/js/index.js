$(function() {
    var socket = undefined;

    // check if the user is logged in when the page is loaded
    $.ajax({
        type : 'GET',
        url : 'info/',
        dataType : 'json',
        success : function(data, textStatus, jqXHR) {
            if (data.name != undefined) {
                loginSuccess(data);
            }
        },
        error : function(jqXHR, textStatus, errorThrown) {
            // alert('error.');
        }
    });

    // login callback
    var loginSuccess = function(data) {
        socket = io.connect('http://localhost:3000', {
            'force new connection' : true
        });

        $("form#login, form#logout, div#agenda").toggleClass("hidden");
        $("form#logout #name").text(data.name);
        buildCalendar();
    };

    // logout callback
    var logoutSuccess = function() {
        $("form#login, form#logout, div#agenda").toggleClass("hidden");

        $("form#logout #name").text("");
        $("form#login :input[name=name] :eq(0)").val("");
    };

    // login handler
    $("form#login").submit(function(e) {
        var name = $("form#login :input[name=name] :eq(0)").val();

        $.ajax({
            type : 'POST',
            url : 'login/' + name,
            dataType : 'json',
            success : function(data, textStatus, jqXHR) {
                loginSuccess(data);
            },
            error : function(jqXHR, textStatus, errorThrown) {
                alert('error.');
            }
        });

        // this will make the browser believe the submit happens and thus
        // it will save the values for future autocomplete
        $(this).attr('target', 'fakeTarget');

        return true;
    });

    // logout handler
    $("form#logout").submit(function(e) {
        $.ajax({
            type : 'POST',
            url : 'logout/',
            dataType : 'json',
            success : function(data, textStatus, jqXHR) {
                logoutSuccess();
            },
            error : function(jqXHR, textStatus, errorThrown) {
                alert('error.');
            }
        });

        e.preventDefault();
        return true;
    });

    // add apointment handler
    $("form#add").submit(function() {        
        var o = {};
        _.each($(this).serializeArray(), function(obj, key) { o[obj.name] = obj.value; });
        
        var days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
                     "Friday", "Saturday" ];
        
        var hours = [ "7am", "8am", "9am", "10am", "11am", "12pm", "1pm",
                      "2pm", "3pm", "4pm", "5pm", "6pm" ];

        var column = days.indexOf(o.day) + 1;
        var row1 = hours.indexOf(o.start);
        var row2 = hours.indexOf(o.end);
        
        var tbody = $("#calendar table tbody:eq(0)");
        
        var td1 = tbody.children("tr:eq("+row1+")").children("td:eq("+column+")");
        
        td1.text(o.desc).attr('rowspan', row2-row1).addClass('busy');
                
        tbody.children("tr").slice(row1+1, row2).each(function() {
            $(this).children("td:eq("+column+")").remove();
        });        
        
        return false;
    });

    // disabled possible earlier end dates when start hours change
    $("form#add select[name=start] :eq(0)").change(function() {
        var start = $(this);
        var end = $("form#add select[name=end] :eq(0)");

        end.children("option").each(function(index) {
            if (index <= start.prop("selectedIndex")) {
                $(this).attr('disabled', 'true');
            } else {
                $(this).removeAttr('disabled');
            }
        });

        end.prop("selectedIndex", start.prop("selectedIndex") + 1);

        return true;
    }).change();

    // disabled the last possible start hour
    $("form#add select[name=start] :eq(0) option:LAST-CHILD").attr('disabled',
            'true');

    // function to build the calendar
    var buildCalendar = function() {
        var cal = $("#calendar:eq(0)");
        var table = $("<table>");
        var thead = $("<thead>");
        var tbody = $("<tbody>");

        cal.html(table.append(thead).append(tbody));

        var days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
                "Friday", "Saturday" ];

        var tr = $("<tr>");

        tr.append($("<td>").text(""));

        days.forEach(function(d) {
            tr.append($("<td>").text(d));
        });

        thead.append(tr);

        var hours = [ "7am", "8am", "9am", "10am", "11am", "12pm", "1pm",
                "2pm", "3pm", "4pm", "5pm" ];

        hours.forEach(function(h) {
            var tr = $("<tr>");
            tr.append($("<td>").text(h));

            days.forEach(function(d) {
                tr.append($("<td>").text(""));
            });

            tbody.append(tr);
        });
    };
});