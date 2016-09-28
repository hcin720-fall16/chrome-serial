//This file is what starts the Chrome app. You will want to change the
// width and height to meet your needs. Notice that the height here is
// reflected in the HTML's "<div id='#log'>" to set the height of the
// logging div to the same height as defined here.
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'outerBounds': {
      'width': 400,
      'height': 500
    }
  });
});
