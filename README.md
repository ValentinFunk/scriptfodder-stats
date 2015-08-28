# scriptfodder-stats

![build status](http://ci.kamshak.com/projects/6/status.png?ref=master)

Scriptfodder Sales statistics using the SF API. 100% clientside, no API key collecting.
Can be accessed here: [http://sfstats.kamshak.com/](http://sfstats.kamshak.com/)

## Installation
To install the project first clone it:
git clone https://github.com/Kamshak/scriptfodder-stats.git

Make sure you have NodeJS installed. (https://nodejs.org/download/). Next install bower:

    npm install -g bower

Then go into the project's directory and install all dependencies:

    cd scriptfodder-stats
    npm install && bower install

To start a development server run gulp:

    gulp

## Building the Project
To build the project execute a gulp build:

    gulp build

The files in the dist folder can then be uploaded to any static hosting.
