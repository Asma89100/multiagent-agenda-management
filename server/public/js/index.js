$(function() {
    var socket = undefined;

    $("form#login").submit(function() {
        var name = $("form#login :input[name=name] :eq(0)").val();

        $.ajax({
            type : 'POST',
            url : 'login/' + name,
            dataType : 'json',
            success : function(data, textStatus, jqXHR) {
                socket = io.connect('http://localhost:3000', {
                    'force new connection' : true
                });

                $("form#login, form#logout, div#agenda").toggleClass("hidden");
                $("form#logout #name").text(name);
                buildCalendar();
            },
            error : function(jqXHR, textStatus, errorThrown) {
                alert('error.');
            }
        });

        return false;
    });

    $("form#logout").submit(function() {
        $.ajax({
            type : 'POST',
            url : 'logout/',
            dataType : 'json',
            success : function(data, textStatus, jqXHR) {
                $("form#login, form#logout, div#agenda").toggleClass("hidden");

                $("form#logout #name").text("");
                $("form#login :input[name=name] :eq(0)").val("");
            },
            error : function(jqXHR, textStatus, errorThrown) {
                alert('error.');
            }
        });

        return false;
    });

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
                "2pm", "3pm", "4pm", "5pm", "6pm" ];

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