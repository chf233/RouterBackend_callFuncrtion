$(function() {
    console.log("Application started");

    // Update the variables below with your applicationID and applicationSecret strings
    var applicationID = "6d99b2a079cc11ea88b46f998ddae648",
        applicationSecret = "S6Hi04Pwsoa1pJ5g3eK7qlr8P7KxKjwStUCga8ab0X86bc4nmMNGrl2xW9yYw6EH";

    var RainbowUsername, RainbowPassword, RainbowBubbleId, contact, bubble;

    // Define two buttons
    var submitProblemButton = document.getElementById('submitProblem');
    var status = document.getElementById('status');
    var callButton = document.getElementById('callButton');

    // Submit Problem button function here
    submitProblemButton.addEventListener("click", function(){

        // Get data
        var productName = document.getElementById("product");
        var productIssue = document.getElementById("problem");

        // Change window visibility
        var problemStatement = document.getElementById("statement");
        var callWindow = document.getElementById("callWindow");
        problemStatement.style.display = "none";
        callWindow.style.display = "inherit";

        // Send data
        var data = {"product": productName.value, "issue": productIssue.value};
        xhttp.open('POST', 'submitProblem', true);
        xhttp.setRequestHeader('Content-Type','application/json');
        xhttp.send(JSON.stringify(data));

        //start call
    });

    /* Bootstrap the SDK */
    angular.bootstrap(document, ["sdk"]).get("rainbowSDK");

    /* Callback for handling the event 'RAINBOW_ONREADY' */
    var onReady = function onReady() {
        // Put your own code here
        // Use of ajax to fetch result
        console.log("Fetching result");
        // get the value from local storage
        var data=localStorage.getItem('category');
        var dataTosend={"cat": data};
        var xhttp = new XMLHttpRequest();
        xhttp.open('POST', 'guestLogin', true);
        xhttp.setRequestHeader('Content-Type','application/json');
        // send the data over to server
        xhttp.send(JSON.stringify(dataTosend));
        // wait for server to return the guest user cred
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var result = JSON.parse(this.responseText);
                RainbowUsername = result.Username;
                RainbowPassword = result.Password;
                RainbowBubbleId = result.BubbleId;
                console.log("Data fetched");
                console.log("bubble id is:", RainbowBubbleId);
                
                // Sign in to rainbow
                rainbowSDK.connection.signin(RainbowUsername, RainbowPassword)
                               .then(function(object) {
                                    status.innerHTML = 'Agent connected';
                                    console.log("User login successful", object);
                                    console.log(RainbowUsername);
                                    console.log(RainbowPassword);
                                    callButton.removeAttribute("disabled");
                                })
                                .catch(function(err) {
                                    console.log("User login failed", err);
                                });
                console.log("Bubble id is", RainbowBubbleId);
            }else if(this.status != 200){
                console.log("Wrong when fetching data from api");
            }
        };

        callButton.addEventListener("click",function(){
            console.log("button click");
            rainbowSDK.contacts.searchById("5e594f366c332176648fd926").then(function (contact) {
                console.log(contact);
                var res = rainbowSDK.webRTC.callInAudio(contact);
                if (res.label === "OK") {
                    console.log("yeeee");
                }
                else{
                    console.log("nooooo");
                }
            });
            //
            console.log("finish");
            var bubble = rainbowSDK.bubbles.getBubbleById(RainbowBubbleId);
            //rainbowSDK.bubbles.startOrJoinWebRtcConference(bubble);
            console.log("run");
            if (rainbowSDK.bubbles.hasActiveConferenceSession()) {
                console.log("cannot");
        
                // You are not able to start or join a web conference
            } else {
                console.log("can");
                // You are free to start or join a web conference
    
            }
            /*
            rainbowSDK.bubbles
    .startOrJoinWebRtcConference(bubble)
    .then(function(bubbleWithWebConf) {
        //Everything went fine, WebRTC conference is launched
        bubble = bubbleWithWebConf;
        console.log("created web");
    })
    .catch(function(error) {
        //Something went wrong, handle the error
        console.log("nooooo")
    });*/

        });

    }

    /* Callback for handling the event 'RAINBOW_ONCONNECTIONSTATECHANGED' */
    var onLoaded = function onLoaded() {
        console.log("SDK Loading");

        rainbowSDK
            .initialize(applicationID, applicationSecret)
            .then(function() {
                console.log("initialized sdk");
            })
            .catch(function(err) {
                console.log("initialization error", err);
            });
        
            console.log("start fetching device");
            navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function(stream) {
                /* Stream received which means that the user has authorized the application to access to the audio and video devices. Local stream can be stopped at this time */
                stream.getTracks().forEach(function(track) {
                    track.stop();
                });
            
                /*  Get the list of available devices */
                navigator.mediaDevices.enumerateDevices().then(function(devices){
                    console.log("start navigating");
                    /* Do something for each device (e.g. add it to a selector list) */
                    devices.forEach(function(device) {
                        switch (device.kind) {
                            case "audioinput":
                                // This is a device of type 'microphone'
                                console.log("audio input");
                                break;
                            case "audiooutput":
                                // This is a device of type 'speaker'
                                console.log("audiooutput");
                                break;
                            case "videoinput":
                                // This is a device of type 'camera'
                                console.log("videoinput");
                                break;
                            default:
                                console.log("nothing");
                                break;
                        }
                    });
            
                }).catch(function(error) {
                    /* In case of error when enumerating the devices */
                    console.log("error");
                });
            }).catch(function(error) {
                /* In case of error when authorizing the application to access the media devices */
                console.log("autorize failed");
            });
            console.log("ends");
            /*
            var bubble = rainbowSDK.bubbles.getBubbleById(RainbowBubbleId);
            console.log(bubble.dbId);
            rainbowSDK.bubbles.startOrJoinWebRtcConference(bubble).then(function(bubbleWithWebConf) {
                //Everything went fine, WebRTC conference is launched
                console.log("yee");
                bubble = bubbleWithWebConf;

            })
            .catch(function(error) {
                //Something went wrong, handle the error
                console.log("nooo");
            });*/
    };


    /* Listen to the SDK event RAINBOW_ONREADY */
    document.addEventListener(rainbowSDK.RAINBOW_ONREADY, onReady)
    /* Listen to the SDK event RAINBOW_ONLOADED */
    document.addEventListener(rainbowSDK.RAINBOW_ONLOADED, onLoaded)
    /* Load the SDK */
    rainbowSDK.load();
});