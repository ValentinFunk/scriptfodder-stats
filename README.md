# Scriptfodder Sales Statistics & Graphs

[![wercker status](https://app.wercker.com/status/e4906f0a294addb9c15ef7fa008e16fe/s/master "wercker status")](https://app.wercker.com/project/bykey/e4906f0a294addb9c15ef7fa008e16fe)

Scriptfodder Sales Statistics using the SF API. 100% clientside, no API key collecting. Made with Angular.JS and D3.

**Can be accessed here: [https://kamshak.github.io/scriptfodder-stats/](https://kamshak.github.io/scriptfodder-stats/)**

## Installation / Development
To install the project first clone it:
git clone https://github.com/Kamshak/scriptfodder-stats.git

Make sure you have NodeJS installed. (https://nodejs.org/download/). Next install bower:

    npm install -g bower

Then go into the project's directory and install all dependencies:

    cd scriptfodder-stats
    npm install && bower install

To start a development server:

    gulp serve

## Building the Project

To build the project execute gulp build:

    gulp build

The files in the dist folder can then be uploaded to any static hosting.
