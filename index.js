"use strict";
const logger    = require('./app//modules/logger');
const push = require("./app/modules/database_mod");
var db = require("./database_functions");

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

// For ssl link
var https = require('https');
var fs = require('fs');

// Load the SDK
let RainbowSDK = require("rainbow-node-sdk");

app.use('/public', express.static('public'));
app.use('/static', express.static('static'));

var connections = {};

// Define your configuration
let options = {

    // SSL options. DO NOT MODIFY
    // Passphrase for certs: foobar
    // Server private key
    key: fs.readFileSync('./ssl/server-key.pem'),
    // Cert authority
    ca: [fs.readFileSync('./ssl/ca-cert.pem')],
    // Server cert
    cert: fs.readFileSync('./ssl/server-cert.pem'),

    // If you want to use pfx files, just uncomment the code below and comment the code above
    /*
    pfx:fs.readFileSync('./ssl/server.pfx'),
	passphrase:'foobar'
    */

    rainbow: {
        host: "sandbox"
    },
    credentials: {
        login: "hongfang_chen@mymail.sutd.edu.sg", // To replace by your developer credendials
        password: "Huc[>0IfAq*4" // To replace by your developer credentials
    },
    // Application identifier
    application: {
        appID: "0cf34a8079d411ea88b46f998ddae648",
        appSecret: "0vHfyutBs1UHVGXKMC7iaSlszVjNmkwy9wpfDD7eOmxLizc3tbJiZdF5OSq1fcl1"
    },

    // Logs options
    logs: {
        enableConsoleLogs: true,
        enableFileLogs: false,
        "color": true,
        "level": 'debug',
        "customLabel": "vincent01",
        "system-dev": {
            "internals": false,
            "http": false,
        }, 
        file: {
            path: "/var/tmp/rainbowsdk/",
            customFileName: "R-SDK-Node-Sample2",
            level: "debug",
            zippedArchive : false/*,
            maxSize : '10m',
            maxFiles : 10 // */
        }
    },
    // IM options
    im: {
        sendReadReceipt: true
    }
};

// Instantiate the SDK
let rainbowSDK = new RainbowSDK(options);

// Start the SDK
rainbowSDK.start().then(() => {
     // Do something when the SDK is connected to Rainbow

     // Set static folders
     // Grant access permission
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    // get root html
    app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+ "/public/index.html"));
    });

    // get all other htmls
    /*
    contactUs
    chat
    email
    call
    */
    app.get('/chat.html', function(req, res){
        res.sendFile(path.join(__dirname+ "/public/chat.html"));
    })

    app.get('/chatQueueTooLong.html', function(req, res){
        res.sendFile(path.join(__dirname+ "/public/chatQueueTooLong.html"));
    })

    app.get('/contactUs.html', function(req, res){
        res.sendFile(path.join(__dirname + "/public/contactUs.html"));
    })

    app.get('/email.html', function(req, res){
        res.sendFile(path.join(__dirname + "/public/email.html"));
    })

    app.get('/call.html', function(req, res){
        res.sendFile(path.join(__dirname + "/public/call.html"));
    })

    app.get('/vendors-sdk.min.js', function(req, res){
        res.sendFile(path.join(__dirname + "/public/vendors-sdk.min.js"));
    })

    app.get('/rainbow-sdk.min.js', function(req, res){
        res.sendFile(path.join(__dirname + "/public/rainbow-sdk.min.js"));
    })

    app.get('/chat.js', function(req, res){
        res.sendFile(path.join(__dirname + "/public/chat.js"));
    })

    app.post('/endChat', function(req, res){
        var rbwbubbleid = req.body.bubbleid;
        // G set engage of the agent in the bubble from 1 to 0
        db.remove_engagement(rbwbubbleid);
        console.log("bubbleid: "+rbwbubbleid);
        res.end();
    });

    app.post('/longPoll', function(req, res){
        // req: {"problem" : "iphone,login", "guestuserid":"..."}
        var cat = req.body.problem;
        var catArray = cat.split(',');
        var category = catArray[0];
        var skill = catArray[1];
        var guestuserid = "$"+req.body.guestuserid;
        if(guestuserid in connections){
            // alr sent req before
            var agentid = connections[guestuserid];
            var dataToSend = {'agentid':agentid};
        }else{
            connections[guestuserid] = null;
            console.log("first request: guestuserid added into connections");
            // use the guestuserid to queue in the database - category - skill
            //db.add_to_queue(guestuserid, category, skill);
            var dataToSend = {'agentid':null};
        }
        res.end(JSON.stringify(dataToSend));
    });

    app.post('/endCall', function(req, res){
        var guestuserid = "$"+req.body.guestuserid;
        // G set engage of the agent in the bubble from 1 to 0
        //db.remove_engagement(guestuserid);
	delete connections[guestuserid];
        console.log("ENDED CALL");
        res.end();
    });
	
    // TEST POST METHOD TO END THE RES and SEND AGENT ID OVER TO WEBSITE
     app.post('/agentFree', function(req, res){
        // hardcode an agent to call
	var agentid = "5e8e319f35c8367f99b9f475";
	// becos no database so just take all res from connection
	for(var key of Object.keys(connections)){
             // set the value of that guestuserid key to be the agentid
              connections[key]=agentid;
              //delete connections[key];
	}
	     
    });
	
    app.post('/checkQueue', function(req, res){
        var cat = req.body.problem;
        var catArray = cat.split(',');
        console.log("category: "+cat);
        var category = catArray[0];
        var skill = catArray[1];
        console.log("Checking Queue for category: "+category+"   skill: "+skill);

        // G: check the queue for category
        // if no space = time = 'Long'
        // if got space = time = 'Ok'
        var time;
        // FOR TESTING ------------------------------------ iphone,battery_issues
        if(category == 'iphone' && skill == 'battery_issues'){
            // no space
            time = 'Long';
        }else{
            time = 'Ok';
        }
        // FOR TESTING ------------------------------------
        var dataToSend = {'time':time}
        res.end(JSON.stringify(dataToSend));
    });

    app.post('/guestLogin', async function(req, res){
        var cat = req.body.cat;
        var catArray = cat.split(',');
        console.log("category: "+cat);
        var category = catArray[0];    //'iphone' or 'macbook'
        var skill = catArray[1];       //crash, network, battery or screen, booting, update 
        console.log("category: "+category+"   skill: "+skill);
        console.log("Creation of guest account request received.");
        // Create account
        var guestaccount = await rainbowSDK.admin.createAnonymousGuestUser(7200).then( (guest) => {
            return guest;
        }).catch((err) => {
            logger.log("debug", "error creating user");
        });
        var contact_id = await rainbowSDK.contacts.getContactById(guestaccount.id);

        // Create Bubble of name support
        let withHistory = false;
        var bubbleId;
        var bubble = await rainbowSDK.bubbles.createBubble("Debug", "A little description of my bubble", withHistory).then((bubble) => {
            bubbleId = bubble.id;
            return bubble;
        }).catch(function(err) {
            console.log("Error creating bubble");
        });
        //
        // Add guest into bubble
        rainbowSDK.bubbles.inviteContactToBubble(contact_id, bubble, false, false, "").then(function(bubbleUpdated) {
            // do something with the invite sent
            logger.log("debug", "guest user has been added to bubble");
            logger.log("debug", "bubble jid: "+ bubbleUpdated.jid);
        }).catch(function(err) {
            // do something if the invitation failed (eg. bad reference to a buble)
            logger.log("debug", "guest user invite failed");
        });
        //adding the created bubble to the appropriate agent queues in db
        db.add_to_queue(bubbleId,category,skill);

        // Add agent into bubble
        // Test function only
        var agent_id = await rainbowSDK.contacts.getContactById("5e60e5ddd8084c29e64eba90");
        rainbowSDK.bubbles.inviteContactToBubble(agent_id, bubble, false, false, "").then(function(bubbleUpdated) {
            logger.log("debug", "agent added into bubble");                
        }).catch(function(err) {
            // do something if the invitation failed (eg. bad reference to a buble)
            logger.log("debug", "agent user invite failed");
        });
    
       

        var loginCred = {"Username": guestaccount.loginEmail, "Password": guestaccount.password, "BubbleId": bubbleId};
        
        // returns the credentials for guest user account
        res.end(JSON.stringify(loginCred));
        
    })
     
    var server = app.listen(8081, function () {
        var host = server.address().address
        var port = server.address().port
        console.log("Example app listening at http://%s:%s", host, port)
     });

    https.createServer(options, app).listen(8086, function () {
        console.log('Https server listening on port ' + 8086);
    });
});
