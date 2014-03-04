/*
 *
 *
 *
 */
//    $.ajaxSetup({ cache: true });
//    $.getScript('//connect.facebook.net/en_UK/all.js', function(){
//    });


var uid;

// Top Page initial Process
$(document).on("pageshow", "div#top", function(event) {
    console.log("div#top showed");

    FB.init({
        appId      : "698356506895047",
        status     : true,
        cookie     : true,
        xfbml      : true,
        oauth      : true
    });

    FB.Event.subscribe('auth.authResponseChange', function(response) {
        if (response.status === 'connected') {
            console.log("response.status=connected");
            console.log("userID: " + response.authResponse.userID);
            uid = response.authResponse.userID;
            $( ":mobile-pagecontainer" ).pagecontainer("change", "#main", {
                transition: "fade"
            });
        } else if (response.status === 'not_authorized') {
            console.log("response.status=not_authorized");
            FB.login(function(response){
            }, {scope: "user_status,user_checkins,read_stream"});
        } else {
            console.log("response.status=null");
            $( ":mobile-pagecontainer" ).pagecontainer("change", "#login", {
                transition  : "pop",
                role        : "dialog"
            });
        }
    });

    setTimeout(function() {
        FB.getLoginStatus(function(response) {
            console.log(response);
            if (response.status === 'connected') {
                console.log("response.session=not null");
                uid = response.authResponse.userID;
                $(":mobile-pagecontainer").pagecontainer("change", "#main", {
                    transition: "fade"
                });
            } else {
                $(":mobile-pagecontainer").pagecontainer("change", "#login", {
                    transition  : "pop",
                    role        : "dialog"
                });
            }
        });
    }, 3000);

});

// Login Page initial Process
$(document).on("pageshow", "div#login", function(event) {
    console.log("div#login showed");

    FB.getLoginStatus(function(response) {
        console.log(response);
        if (response.status === 'connected') {
            console.log("response.session=not null");
            uid = response.authResponse.userID;
            $(":mobile-pagecontainer").pagecontainer("change", "#main", {
                transition: "fade"
            });
        }
    });

    $("a#login-button").on("click", function(){
        FB.login(function(response){
        }, {scope: "user_status,user_checkins,read_stream,email"});
    });

});

// Main Page initial Process
var currentInfoWindow;
$(document).on("pageshow", "div#main", function(event) {
    console.log("div#main showed");

    showCheckins(uid, false, false);

    function attachInfoWindow(map, marker, infowindow) {
        google.maps.event.addListener(marker, 'click', function() {
            if (currentInfoWindow != null) {
                currentInfoWindow.close();
            }
            infowindow.open(map,marker);
            currentInfoWindow = infowindow;
        });
    }

    function dateToString(objDate) {
        var userAgent = window.navigator.userAgent.toLowerCase();

        var dateStr = "";

        if (userAgent.indexOf('safari') != -1) {
            dateStr = objDate.getFullYear() + "-" + ("0"+(objDate.getMonth()+1)).slice(-2) + "-" + objDate.getDate();
        } else {
            dateStr = objDate.getFullYear() + "/" + ("0"+(objDate.getMonth()+1)).slice(-2) + "/" + objDate.getDate();
        }

        return dateStr;
    }

    function dateStrToUnixtime(dateStr) {
        return Math.round((new Date(dateStr)).getTime() / 1000);
    }

    function getUrlVars(url) {
        var params = url.split("?")[1].split("&");
        var paramarray = new Object();
        for (i=0; i<params.length; i++) {
            var key = params[i].split("=")[0];
            var value = params[i].split("=")[1];
            paramarray[key] = value;
        }
        return paramarray;
    }

    function showCheckins(uid, goprev, gonext) {
        console.log('Welcome!  Fetching your information.... ');

        var since = $("input#sincedate").val();
        var until = $("input#untildate").val();
        var prev = $("a#prev-button").attr("data-since");
        var next = $("a#next-button").attr("data-until");

        try {

            console.log("uid: " + uid);
            console.log("since: " + since);
            console.log("until: " + until);
            console.log("prev: " + prev);
            console.log("next: " + next);

            var resultperpage = $("select#resultperpage").val();
            var url = "/" + uid + "/feed?date_format=U&limit=" + resultperpage + "&fields=place,story,message";
            if (goprev) {
                url = url + "&since=" + prev;
                if (since != "") {
                    url = url + "&until=" + dateStrToUnixtime(until);
                }
            } else if (gonext) {
                url = url + "&until=" + next;
                if (until != "") {
                    url = url + "&since=" +  dateStrToUnixtime(since);
                }
            } else {

                if (since != "" && until != "") {
                    url = url + '&since=' + dateStrToUnixtime(since) + '&until=' + dateStrToUnixtime(until);
                } else if (since != "") {
                    url = url + '&since=' + dateStrToUnixtime(since);
                } else if (until != "") {
                    url = url + '&until=' + dateStrToUnixtime(until);
                } else {
                    console.log("all == null");
                }

            }

            console.log("url: " + url);
            FB.api(url, function(response) {
                console.log(response);

                $("div#mapcanvas").empty();
                var latlngs = [];
                var mapOptions = {
                        zoom: 3,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                $("div#mapcanvas").css({
                    height  : ($(document).height() - $('div[data-role="header"]').height() - $('div[data-role="footer"]').height() - 30),
                    margin  : 0,
                    padding : 0
                });
                var map = new google.maps.Map(document.getElementById('mapcanvas'), mapOptions);
                var bounds = new google.maps.LatLngBounds();

                var defaultuntil = new Date(1970, 1, 1);
                var defaultsince = new Date();
                var checkinlist = $("ul#checkin-list");
                checkinlist.empty();
                for(i=(response.data.length-1); i>-1; i--) {

                    if ('place' in response.data[i]) {
                        var data = response.data[i];

                        var place = data.place;
                        var created_time = new Date(parseInt(data.created_time) * 1000);
                        checkinlist.append("<li>Checked in " + place.name + " on " + created_time + ".</li>");

                        var latlng = new google.maps.LatLng(place.location.latitude, place.location.longitude);
                        bounds.extend(latlng);
                        latlngs.push(latlng);

                        var marker = new google.maps.Marker({
                            position: latlng,
                            map: map,
                            title:place.name
                        });

                        var link = "http://www.facebook.com/" + data.id;
                        var content = "Check-In: " + place.name + "<br />"
                        + "Date: " + created_time + "<br />";
                        if ("story" in data) {
                            content = content + "Comment: " + data.story + "<br />";
                        } else if ("message" in data) {
                            content = content + "Comment: " + data.message + "<br />";
                        }
                        content = content + "<a href=\"" + link + "\">" + link + "</a>";
                        var infowindow = new google.maps.InfoWindow({
                            content: content
                        });

                        attachInfoWindow(map, marker, infowindow);

                        if (created_time.getTime() < defaultsince.getTime()) {
                            defaultsince = created_time;
                        }
                        if (created_time.getTime() > defaultuntil.getTime()) {
                            defaultuntil = created_time;
                        }

                    }
                }

                map.fitBounds(bounds);

                var trackline = $("select#trackline").val();
                if (trackline === "on") {
                    var footmark = new google.maps.Polyline({
                        path: latlngs,
                        strokeColor: "#FF0000",
                        strokeOpacity: 1.0,
                        strokeWeight: 2,
                        icons: [{
                            icon: {
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                            }
                        }]
                    });
                    footmark.setMap(map);
                }

                checkinlist.listview('refresh');

                $("a#prev-button").attr("data-since", getUrlVars(response.paging.previous).prev);
                $("a#next-button").attr("data-until", getUrlVars(response.paging.next).next);

                if (since == "") {
                    $("input#sincedate").val(dateToString(defaultsince));
                }
                if (until == "") {
                    $("input#untildate").val(dateToString(defaultuntil));
                }

            });

        } catch (e) {
            console.log("exception caught: " + e);
        }
    };

    // Logout Button Click Event
    $("a#logout-button").on("click", function(){
        FB.logout();
    });

    // Prev Button Click Event
    $("a#prev-button").on("click", function() {
        showCheckins(uid, true, false);
    });

    // Next Button Click Event
    $("a#next-button").on("click", function() {
        showCheckins(uid, false, true);
    });

    // Filter Button Click Event
    $("a#filter-button").on("click", function() {

        var $this = $( this ),
        theme = $this.jqmData( "theme" ) || $.mobile.loader.prototype.options.theme,
        msgText = $this.jqmData( "msgtext" ) || $.mobile.loader.prototype.options.text,
        textVisible = $this.jqmData( "textvisible" ) || $.mobile.loader.prototype.options.textVisible,
        textonly = !!$this.jqmData( "textonly" );
        html = $this.jqmData( "html" ) || "";
        $.mobile.loading( "show", {
            text: msgText,
            textVisible: textVisible,
            theme: theme,
            textonly: textonly,
            html: html
        });

        showCheckins(uid, false, false);
        $.mobile.loading("hide");
    });

});

//Account Information Page initial Process
$(document).on("pageshow", "div#accountinfo", function(event) {
    console.log("div#accountinfo showed");
    var url = "/" + uid + "/fields?name,email,link";
    FB.api(url, function(response) {
        console.log(response);

        $("input#username").val(response.name);
        $("input#email").val(response.name);
        $("input#link").val(response.link);

    });
});
