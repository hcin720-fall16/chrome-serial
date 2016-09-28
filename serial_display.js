/*
	This the code for a Chrome App that will read lines from the serial
	port and do something with them. The "something" currently is just
	to log them to the screen. You can change what it does in the
	onLineReceived() function near the bottom of the file.

	There are a lot of comments in this file to help you understand how
	it does what it does, but you don't necessarily need to go through
	it all.
*/

//Use jQuery to run this when the browser is done loading the page
$(function()
	{
		//Keep track of all connections that have been made. We get a
		// connection ID, so we'll use that as a key for this dictionary
		// to store the connectionInfo objects that the connect() function
		// gives to us. This will be used later in serialDataReceived().
		var connections = {};

		//Keep track of which port we wanted to connect to.
		var whichPort;

		//The first thing to do is call the special Chrome function to
		// list serial devices. When it's done, it will call the gotPorts()
		// callback function below.
		chrome.serial.getDevices(gotPorts);

		//Here we set up the callback serialDataReceived() to be called
		// anytime *any* connected serial port gets data; we have to then
		// manually check to see if it's the serial port we care about.
		// This is what we use the connections dictionary above for.
		chrome.serial.onReceive.addListener(serialDataReceived);

		//This is the callback function that gets called when
		// chrome.serial.getDevices() is done getting devices.
		function gotPorts(ports)
		{
			//Find the <div> with the id of "log" and add information about
			// what we found to it.
			$('#log').append("<h1>Found serial ports:</h1>");
			for(var i = 0; i < ports.length; i++)
			{
				//Construct the HTML to make a new button. The 'data-port' attribute
				// gets attached to the button and we can easily read it later with
				// jQuery; this is a handy way of adding non-visual data to elements.
				var newButtonHTML = "<button data-port='" + ports[i].path + "'>" +
					ports[i].path + "</button><br>"

				//Using the jQuery $() function with a string makes a new HTML
				// element out of that string, so that's what we do here to
				// make the button. When we make it, we append the new
				// button to the <div> with the id of "log", and then add a
				// function to take effect when we click the button.
				$(newButtonHTML).appendTo('#log').click(serialPortButtonClick);
			}
			
			//Add a dividing line under the buttons so we can print log
			// data to it later.
			$('#log').append("<hr>");
		};

		//This is the function that gets called when any of the serial
		//port buttons are pressed
		function serialPortButtonClick(event)
		{
			//The "this" variable refers to the object that triggered the click
			// event. We wrap it in $() to make it into a jQuery object. Then
			// we can use the .data() function to get out the "data-port"
			// attribute we added when we created the button element. jQuery
			// automatically lets us access it without having to type the "data-"
			// part.
			var portPath = $(this).data("port");
			console.log("Picked ", portPath);

			//Keep track of which port we want to connect to. We use this later
			// in serialDataReceived() to only look at data from this serial
			// port, and ignore any others that might have been connected
			// somehow.
			whichPort = portPath;

			//Connect to the serial device. When it gets connected, call the
			// function onSerialConnect() with the connectionInfo parameter.
			chrome.serial.connect(portPath,
				{
					bitrate: 9600,   //Here's how fast the Photon is communicating.
					name: portPath,  //This helps us figure out which port it is later
				},
				onSerialConnect);
		};


		function onSerialConnect(connectionInfo)
		{
			//Log that we've connected to the console so we can explore the
			// connectionInfo object interactively
			console.log("Connected to " + connectionInfo.name, ": ", connectionInfo);

			//Also log to our <div>
			$("#log").append("Connected to " + connectionInfo.name + "<br>");

			//Since the connectionInfo goes away after this function returns,
			// we want to hold on to it. We'll do that by storing it in the
			// connections dictionary. We use the connectionId as a key because
			// that's what serialDataReceived() gives us.
			connections[connectionInfo.connectionId] = connectionInfo;
		}


		//This function does some magic to convert the data coming from
		// the serial port into a string. I copied-and-pasted it.
		function convertArrayBufferToString(buf)
		{
			var bufView = new Uint8Array(buf);
			var encodedString = String.fromCharCode.apply(null, bufView);
			return decodeURIComponent(encodedString);
		}

		//This variable gets used by serialDataReceived to accumulate data
		// until an entire line is received.
		var stringReceived = '';

		//This function is called whenever Chrome receives serial data from
		// *any* connected port. Mostly you will only have one Photon connected,
		// but it's a good idea to be careful and make sure we're dealing with
		// data from the Photon we want. The info parameter has two things in
		// it: connectionId and data.
		function serialDataReceived(info)
		{
			//Pull out the connectionInfo from the connections dictionary based
			// on the connectionId
			connectionInfo = connections[info.connectionId];

			//If we're getting data from a different serial port than the
			// one whose button we clicked on, return from the function since we
			// don't care about this data.
			if(connectionInfo.name != whichPort)
				return;

			//Now we do some weird stuff. This is for a couple of reasons: first,
			// the info.data is in a strange format; and second, we might not
			// get an entire line at a time.

			//Convert the data into a string
			var str = convertArrayBufferToString(info.data);	

			//Check the last character to see if it's a newline character; if
			// so, then we will call the onLineReceived function.
			if(str.charAt(str.length - 1) === '\n')
			{
				//Add the new data to the old data, but take off the last character
				// (which is the newline character)
				stringReceived += str.substring(0, str.length - 1);

				//Call the onLineReceived function with the complete line
				onLineReceived(stringReceived);

				//Now that it's been processed, clear out stringReceived so we
				// can work with new data
				stringReceived = '';
			}
			else  //If we didn't get a newline, then keep accumulating data
			{
				stringReceived += str;
			}
		}


		function onLineReceived(line)
		{
			//Now do something with the data! Here I'm just logging it, but this
			// where you want to add your visualization.
			$('#log').append(line + "<br>");
		}
	}
);
