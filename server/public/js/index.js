$(function() {
    // websocket
    var socket= undefined;
    
    // MAM instance
    var MAM = undefined;
    
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
    
    var mailbox = {
            push : function(msg) {
                console.log("PUSH: " + msg);
                socket.emit('msg', { 'msg' : msg });
            }
    };
    
    var callback = function(action, a) {
        
        if(action == "OK") {
            addAppointmentToCalendar(a);
        } else if(action == "CANCELED") {
            removeAppointmentFromCalendar(a);
        } else if(action == "FAILED") {
            alert(a+" failed");
        }
    };

    // login callback
    var loginSuccess = function(data) {
        socket = io.connect('/');
        
        //msg handler
        socket.on('msg', function (data) {
            console.log("RECEIVE: " + data.msg);
            MAM.handleMessage(data.msg);
        });
        
        socket.emit('login', { 'name' : data.name });
        
        MAM = new mam(data.name, mailbox, callback);

        $("form#login, form#logout, div#agenda").toggleClass("hidden");
        $("form#logout #name").text(data.name);
        buildCalendar();
    };

    // logout callback
    var logoutSuccess = function() {
        socket.emit('logout', {});
        
        MAM = undefined;
        
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
        
        var invitees = o.invitees.split(",");
        
        if(invitees.length == 0 || (invitees.length == 1 && invitees[0] == ""))
            invitees = undefined;        
        
        addAppointment(o.subject, o.day, o.start, o.end, o.duration, invitees);
        
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

        if(end.prop("selectedIndex") <= start.prop("selectedIndex")) {
            end.prop("selectedIndex", start.prop("selectedIndex") + 1);
        }

        return true;
    }).change();

    // disabled the last possible start hour
    $("form#add select[name=start] :eq(0) option:LAST-CHILD").attr('disabled',
            'true');
    
    // disabled start and end times when duration is determined
    $("form#add input[name=duration] :eq(0)").keyup(function() {        
        if($(this).val()) {
            $("form#add select[name=start] :eq(0)").attr('disabled', 'true');
            $("form#add select[name=end] :eq(0)").attr('disabled', 'true');
        } else {
            $("form#add select[name=start] :eq(0)").removeAttr('disabled');
            $("form#add select[name=end] :eq(0)").removeAttr('disabled');
        }
    });
    
    //min duration = 1, max = 11
    $("form#add input[name=duration] :eq(0)").change(function() {
        if($(this).val()) {
            if($(this).val() < 1) {
                $(this).val(1);
            } else if($(this).val() > 11) {
                $(this).val(11);
            }
        }
    });

    
    var removeAppointment = function(a) {
        MAM.removeAppointment(a);
        
        if(a.invitees == undefined)
            removeAppointmentFromCalendar(a);
    };
    
    var removeAppointmentFromCalendar = function(a) {
        var column = (a.start / hours.length) >> 0;
        var row1 = a.start - (hours.length * column);
        
        var td = $("#calendar #td_"+row1+"_"+column);
        
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
    
    var addAppointment = function(subject, day, start, end, duration, invitees) {
        var column = days.indexOf(day);
        var d = column*hours.length;
        
        if(duration) {
            duration = parseInt(duration);
            
            var list = MAM.getAvailableHours(d,11+d,duration);
            if(list ==undefined || list.length == 0) {
                alert('error');
                return;
            }
            
            start = list[0];
            end = start + duration;
        } else {
            start = hours.indexOf(start) + d;
            end = hours.indexOf(end) + d;
            duration = end-start;
        }
        
        if(invitees) {
            MAM.createSharedAppointment(subject, [start], duration, invitees);
            return;
        }
        
        try { 
            var a = MAM.addAppointment(subject, start, end);
            
            //add to calendar
            addAppointmentToCalendar(a);
        } catch(e) {
            alert('error');
        }
    };
    
    var addAppointmentToCalendar = function(a) {
        var column = (a.start / hours.length) >> 0;
        var row1 = a.start - (hours.length * column);
        var row2 = a.end - (hours.length * column);
        
        var td1 = $("#calendar #td_"+row1+"_"+column);
        
        td1.attr({'rowspan': row2-row1}).addClass('busy');
        td1.append($('<div></div>').text(a.subject).append($('<img></img>').attr({'src' : "/img/remove.png"}).addClass("remove").click(function(){removeAppointment(a);})));
                
        for(var r = row1+1; r<row2; r++) {
            $("#calendar #td_"+r+"_"+column).remove();
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