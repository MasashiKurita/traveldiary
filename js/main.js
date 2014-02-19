$("div#fb-root").load(function() {
    console.log("fb loaded");
});

//    $.ajaxSetup({ cache: true });
//    $.getScript('//connect.facebook.net/en_UK/all.js', function(){
//
//        FB.init({
//            appId      : "698356506895047", // App ID
//            status     : true, // check login status
//            cookie     : true, // enable cookies to allow the server to access the session
//            xfbml      : true,  // parse XFBML
//            oauth      : true
//        });

//        FB.getLoginStatus(function(response) {
//            if (response.session) {
//                console.log("response.session=not null");
//                uid = response.authResponse.userID;
//                $(":mobile-pagecontainer").pagecontainer("change", "#main", {
//                    transition: "fade"
//                });
//            } else {
//                console.log("response.session=null");
//                $(":mobile-pagecontainer").pagecontainer("change", "#login", {
//                    transition  : "pop",
//                    role        : "dialog"
//                });
//            }
//        });

//        FB.Event.subscribe('xfbml.render', function() {
//            FB.getLoginStatus(function(response) {
//                if (response.session) {
//                    console.log("response.session=not null");
//                    uid = response.authResponse.userID;
//                    $(":mobile-pagecontainer").pagecontainer("change", "#main", {
//                        transition: "fade"
//                    });
//                } else {
//                    console.log("response.session=null");
//                    $(":mobile-pagecontainer").pagecontainer("change", "#login", {
//                        transition  : "pop",
//                        role        : "dialog"
//                    });
//                }
//            });
//        });

//        FB.Event.subscribe('auth.statusChange', function(response) {
//            if (response.status === 'connected') {
//                console.log("response.status=connected");
//                console.log("userID: " + response.authResponse.userID);
//                uid = response.authResponse.userID;
//                $( ":mobile-pagecontainer" ).pagecontainer("change", "#main", {
//                    transition: "fade"
//                });
//            } else if (response.status === 'not_authorized') {
//                console.log("response.status=not_authorized");
//                FB.login(function(response){
//                }, {scope: "user_status,user_checkins,read_stream"});
//            } else {
//                console.log("response.status=null");
//                $( ":mobile-pagecontainer" ).pagecontainer("change", "#login", {
//                    transition  : "pop",
//                    role        : "dialog"
//                });
//            }
//        });
//
//    });



var uid;
var since;
var until;

$(document).on("pageshow", "div#top", function(event) {
    console.log("div#top showed");

    FB.init({
        appId      : "698356506895047", // App ID
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true,  // parse XFBML
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
        $(":mobile-pagecontainer").pagecontainer("change", "#login", {
            transition  : "pop",
            role        : "dialog"
        });
    }, 3000);

});

$(document).on("pageshow", "div#login", function(event) {
    console.log("div#login showed");

    FB.getLoginStatus(function(response) {
        console.log(response);
        if (response.session) {
            console.log("response.session=not null");
            uid = response.authResponse.userID;
            $(":mobile-pagecontainer").pagecontainer("change", "#main", {
                transition: "fade"
            });
        } else {
            console.log("response.session=null");
            $(":mobile-pagecontainer").pagecontainer("change", "#login", {
                transition  : "pop",
                role        : "dialog"
            });
        }
    });

});

var currentInfoWindow;
//$(document).on("pageshow", "div#main", function(event) {
$(document).on("pagechange", "div#main", function(event) {
    console.log(event);
    console.log("div#main showed");

    since = $("input#sincedate").val();
    until = $("input#untildate").val();
    showCheckins(uid, since, until);

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

    function showCheckins(uid, since, until) {
        console.log('Welcome!  Fetching your information.... ');
        try {

            var url = '/' + uid + '/feed?date_format=U&limit=10000&fields=place,story,message';
            if (since != "" && until != "") {
                url = url + '&since=' + Math.round((new Date(since)).getTime() / 1000) + '&until=' + Math.round((new Date(until)).getTime() / 1000);
            } else if (since != "") {
                url = url + '&since=' + Math.round((new Date(since)).getTime() / 1000);
            } else if (until != "") {
                url = url + '&until=' + Math.round((new Date(until)).getTime() / 1000);
            }
            console.log("url: " + url);
            FB.api(url, function(response) {
                console.log(response);

                var latlngs = [];
                var mapOptions = {
                        zoom: 3,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var map = new google.maps.Map(document.getElementById('mapcanvas'), mapOptions);
                var bounds = new google.maps.LatLngBounds();

                var defaultuntil = new Date(1970, 1, 1);
                var defaultsince = new Date();
                var checkinlist = $("ul#checkin-list");
                for(i=0; i<response.data.length; i++) {

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

                if (since == "") {
                    $("input#sincedate").val(dateToString(defaultsince));
                }
                if (until == "") {
                    $("input#untildate").val(dateToString(defaultuntil));
                }

                checkinlist.listview('refresh');

                map.fitBounds(bounds);

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

            });

        } catch (e) {
            console.log(e);
        }
    };

    $("a#logout-button").bind("click", function(){
        FB.logout();
    });

    $("a#filter-button").bind("click", function() {
        $("ul#checkin-list").empty();
        $("div#mapcanvas").empty();
        var since = $("input#sincedate").val();
        var until = $("input#untildate").val();
        showCheckins(uid, since, until);
    });

});

