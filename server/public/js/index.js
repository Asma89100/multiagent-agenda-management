$(function() {
    // websocket
    var socket = undefined;
    
    // MAM instance
    var MAM = new mam();
    
    // days and hours
    var days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
                 "Friday", "Saturday" ];
    
    var hours = [ "7am", "8am", "9am", "10am", "11am", "12pm", "1pm",
                  "2pm", "3pm", "4pm", "5pm", "6pm" ];    

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

    // add apointment form handler
    $("form#add").submit(function() {        
        var o = {};
        _.each($(this).serializeArray(), function(obj, key) { o[obj.name] = obj.value; });
        
        addAppointment(o.desc, o.day, o.start, o.end);
        
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
    
    var removeAppointment = function(a, td) {
        MAM.removeAppointment(a);
        td.attr({'rowspan': 1}).removeClass('busy').html("");
        
        var id = td.attr("id").split("_");
        
        var tr = td.closest("tr");
        for(var r = 1; r<a.end-a.start; r++) {
            tr = tr.next("tr");
            
            var min = $("td:eq(0)", tr);
            tr.children("td").each(function(i) {                
                if($(this).attr("id") !== undefined) {
                    var c = $(this).attr("id").split("_")[2];
                    if(c<id[2]) {
                        min = $(this);
                    }
                }
            });
            
            $("<td></td>").attr('id', 'td_'+ (parseInt(id[1])+r) +'_'+id[2]).insertAfter(min);
        }
    };
    
    var addAppointment = function(desc, day, start, end) {
        var column = days.indexOf(day);
        var row1 = hours.indexOf(start);
        var row2 = hours.indexOf(end);
        
        var d = column*hours.length;
        
        start = row1 + d;
        end = row2 + d;
        
        try { 
            var a = MAM.addAppointment(desc, day, start, end);
            
            //add to calendar            
            var td1 = $("#calendar #td_"+row1+"_"+column);
            
            td1.attr({'rowspan': row2-row1}).addClass('busy');
            td1.append($('<div></div>').text(desc));
            td1.append($('<img></img>').attr({'src' : "/img/remove.png"}).addClass("remove").click(function(){removeAppointment(a, td1);}));
                    
            for(var r = row1+1; r<row2; r++) {
                $("#calendar #td_"+r+"_"+column).remove();
            }
        } catch(e) {
            alert('error');
        }
    };

    // function to build the calendar
    var buildCalendar = function() {
        var cal = $("#calendar");
        var table = $("<table>");
        var thead = $("<thead>");
        var tbody = $("<tbody>");

        cal.html(table.append(thead).append(tbody));

        var tr = $("<tr>");

        tr.append($("<td>").text(""));

        days.forEach(function(d) {
            tr.append($("<td>").text(d));
        });

        thead.append(tr);       

        hours.forEach(function(h, i) {
            if(i==hours.length-1)
                return;
            
            var tr = $("<tr>");
            tr.append($("<td>").text(h));

            days.forEach(function(d, j) {
                tr.append($("<td>").text("").attr('id' , 'td_'+i+'_'+j));
            });

            tbody.append(tr);
        });
    };
});