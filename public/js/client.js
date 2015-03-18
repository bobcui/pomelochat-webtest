var pomelo = window.pomelo;
var userId;
var channelId;
var base = 1000;
var increase = 25;
var reg = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
var LOGIN_ERROR = "There is no server to log in, please wait.";
var LENGTH_ERROR = "Name/Channel is too long or too short. 20 character max.";
var NAME_ERROR = "Bad character in Name/Channel. Can only have letters, numbers, Chinese characters, and '_'";
var DUPLICATE_ERROR = "Please change your name to login.";

util = {
	urlRE: /https?:\/\/([-\w\.]+)+(:\d+)?(\/([^\s]*(\?\S+)?)?)?/g,
	//  html sanitizer
	toStaticHTML: function(inputHtml) {
		inputHtml = inputHtml.toString();
		return inputHtml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	},
	//pads n with zeros on the left,
	//digits is minimum length of output
	//zeroPad(3, 5); returns "005"
	//zeroPad(2, 500); returns "500"
	zeroPad: function(digits, n) {
		n = n.toString();
		while(n.length < digits)
		n = '0' + n;
		return n;
	},
	//it is almost 8 o'clock PM here
	//timeString(new Date); returns "19:49"
	timeString: function(date) {
		var minutes = date.getMinutes().toString();
		var hours = date.getHours().toString();
		return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
	},

	//does the argument only contain whitespace?
	isBlank: function(text) {
		var blank = /^\s*$/;
		return(text.match(blank) !== null);
	}
};

//always view the most recent message when it is added
function scrollDown(base) {
	window.scrollTo(0, base);
	$("#entry").focus();
};

function addMessageRaw(msg) {
    var messageElement = $(document.createElement("table"));
    messageElement.addClass("message");
    // sanitize
    msg = util.toStaticHTML(JSON.stringify(msg));
    var data = '<tr><td class="msg-text">' + msg + '</td></tr>';
    messageElement.html(data);
    //the log is the stream that we view
    $("#chatHistory").append(messageElement);
    base += increase;
    scrollDown(base);
};

// show tip
function tip(type, name) {
	var tip,title;
	switch(type){
		case 'online':
			tip = name + ' is online now.';
			title = 'Online Notify';
			break;
		case 'offline':
			tip = name + ' is offline now.';
			title = 'Offline Notify';
			break;
		case 'message':
			tip = name + ' is saying now.'
			title = 'Message Notify';
			break;
	}
	var pop=new Pop(title, tip);
};

// set your name
function setId() {
	$("#userId").text(userId);
};

function setChannelId() {
	$("#channelId").text(channelId);
};

// show error
function showError(content) {
	$("#loginError").text(content);
	$("#loginError").show();
};

// show login panel
function showLogin() {
	$("#loginView").show();
	$("#chatHistory").hide();
	$("#toolbar").hide();
	$("#loginError").hide();
	$("#loginUser").focus();
};

// show chat panel
function showChat() {
	$("#loginView").hide();
	$("#loginError").hide();
    $("#chatHistory").show();
	$("#toolbar").show();
	$("entry").focus();
	scrollDown(base);
};

// query connector
function lookupConnector(uid, callback) {
	pomelo.init({
		host: window.location.hostname,
		port: 13021
	}, function() {
		pomelo.request('gate.gateHandler.lookupConnector', {
			userId: userId,
            channelId: channelId
		}, function(res) {
			pomelo.disconnect();
			if(res.code !== 0) {
				showError('error: ' + res.code);
				return;
			}
			callback(res.host, res.port);
		});
	});
};

$(document).ready(function() {
	//when first time into chat room.
	showLogin();

	//wait message from the server.
	pomelo.on('msg', function(msg) {
		addMessageRaw(msg);
        console.log(msg)
	});

	//handle disconect message, occours when the client is disconnect with servers
	pomelo.on('disconnect', function(reason) {
		showLogin();
	});

	//deal with login button click.
	$("#login").click(function() {
		userId = $("#input_userId").attr("value");
		channelId = $('#input_channelId').attr("value");
        token = $('#input_token').attr("value");

		//query entry of connection
		lookupConnector(userId, function(host, port) {
			pomelo.init({
				host: host,
				port: port,
				log: true
			}, function() {
				pomelo.request("connector.connectorHandler.login", {
					userId: userId,
					channelId: channelId,
                    token: token
				}, 
                function(res) {
                    console.log(res)
					if (res.code != 0) {
						showError('error: ' + res.code);
						return;
					}
					setId();
                    setChannelId();
					showChat();
                });
			});
		});
	});

	//deal with chat mode.
	$("#entry").keypress(function(e) {
		// var route = "connector.connectorHandler.chat";
		// var target = $("#usersList").val();
		// if(e.keyCode != 13 /* Return */ ) return;
		// var content = $("#entry").attr("value");//.replace("\n", "");
		// if(!util.isBlank(content)) {
		// 	pomelo.request(route, {
		// 		content: content,
		// 	}, function(data) {
		// 		$("#entry").attr("value", ""); // clear the entry field.
		// 		if(target != '*' && target != userName) {
		// 			addMessage(userName, target, msg);
		// 			$("#chatHistory").show();
		// 		}
		// 	});
		// }
	});
});