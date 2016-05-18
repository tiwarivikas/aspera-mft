//******************************************************
//Global variables
//******************************************************
//nodeInterpreter is location of server side web application
//It is used for all AJAX calls
var nodeInterpreter = "http://mft-demo.mybluemix.net/aspera";
//var nodeInterpreter = "http://localhost:9080/HelloWorld3_war_exploded/aspera";

//******************************************************
//Functions for handling Node requests
//******************************************************

//Makes AJAX call sending location of file to download
//Receives transferSpec (JSON) from server and passes to handler
function downloadFile(caller, path)
{
    jQuery.ajax({
        type: 'POST',
        url: nodeInterpreter,
        data: {download: path}
    })
            .done(function (data) {
                handleDownload(caller, data)
            })
            .fail(function (jqXHR, textStatus) {
                failure(textStatus);
            });
}

//Makes AJAX call sending dummy data
//Receives String of starting directory and places it on page and requests list of files to append to table
function getStartingDirectory()
{
    jQuery.ajax({
        type: 'POST',
        url: nodeInterpreter,
        data: {startingdirectory: "requestDirectory"}
    })
            .done(function (data) {
                jQuery("#startingDirectory").text(data);
    			jQuery("#fileListTable").append(changeDirectory(data));
            })
            .fail(function (jqXHR, textStatus) {
                failure(textStatus);
            });
}

//Makes AJAX call sending current directory
//Receives transferSpec (JSON) from server and passes to handler
function uploadFile()
{
    jQuery.ajax({
        type: 'POST',
        url: nodeInterpreter,
        data: {upload: jQuery("#currentDirectory").text()}
    })
            .done(function (data) {
                handleUpload(data)
            })
            .fail(function (jqXHR, textStatus) {
                failure(textStatus);
            });
}

//Makes AJAX call sending location of new directory to view
//Receives transferSpec (JSON) from server and passes to handler
function changeDirectory(path)
{
    jQuery.ajax({
        type: 'POST',
        url: nodeInterpreter,
        data: {changeDirectory: path}
    })
            .done(function (data) {
                 handleFileList(JSON.parse(data), path);
            })
            .fail(function (jqXHR, textStatus) {
                failure(textStatus);
            });
}

//Makes AJAX call sending location of file to delete
//Also prompts user to verify that they want to delete the file
//Receives transferSpec (JSON) from server and passes to handler
function deleteFile(directory, path)
{
    //We ask user one more time if they are sure.  This operation cannot be undone so this just gives them a chance to change their mind (this is optional)
    if (directory)
    {
        var message = "Are you sure you want to delete the directory:\n\n'" + path + "'?  \n\nThis will delete all of the items in this directory.\nThis operation cannot be undone.";
    }
    else
    {
        var message = "Are you sure you want to delete the file:\n\n'" + path + "'?\n\nThis operation cannot be undone.";
    }
    if (confirm(message))
    {
        jQuery.ajax({
            type: 'POST',
        	url: nodeInterpreter,
            data: {deleteFile: path}
        })
                .done(function (data) {
                    handleDelete(data)
                })
                .fail(function (jqXHR, textStatus) {
                    failure(textStatus);
                });
    }
    else {
    }
}

//Makes AJAX call sending name of new directory to create
//Uses JavaScript alert box to request new directory name
//Receives transferSpec (JSON) from server and passes to handler
function createDirectory()
{
    var dirName = jQuery("#currentDirectory").text() + "/" + window.prompt("Name of Directory?")

    jQuery.ajax({
        type: 'POST',
        url: nodeInterpreter,
        data: {createDir: dirName}
    })
            .done(function (data) {
                handleDirCreate(data)
            })
            .fail(function (jqXHR, textStatus) {
                failure(textStatus);
            });
}

//Makes AJAX call sending location of item to rename as well as new name
//Uses JavaScript alert box to request new name
//Receives transferSpec (JSON) from server and passes to handler
function renameFile(path)
{
	var oldName = path.split("/");
    var newName = window.prompt("New Name for " + path + "?", oldName[oldName.length-1])

    jQuery.ajax({
        type: 'POST',
        url: nodeInterpreter,
        data: {renamePath: path, renameName: newName}
    })
            .done(function (data) {
                handleRename(data)
            })
            .fail(function (jqXHR, textStatus) {
                failure(textStatus);
            });
}

//******************************************************
//These functions are our handlers.  They take the returned data from the AJAX call and process it
//******************************************************

function initConnect(id, callback, caller, spec)
{
  var asperaWeb = {};
  var CONNECT_INSTALLER = '//d3gcli72yxqn2z.cloudfront.net/connect/v4';
  var asperaWeb = new AW4.Connect({
    sdkLocation: CONNECT_INSTALLER,
    minVersion: '3.6.0',
    id: "aspera_web_transfers-" + id
  });
  var asperaInstaller = new AW4.ConnectInstaller({
    sdkLocation: CONNECT_INSTALLER
  });
  var statusEventListener = function (eventType, data) {
    var status = AW4.Connect.STATUS;
    if (eventType === AW4.Connect.EVENT.STATUS) {
      if (data === status.INITIALIZING) {
        asperaInstaller.showLaunching();
      }
      if (data === status.FAILED) {
        asperaInstaller.showDownload();
      }
      if (data === status.OUTDATED) {
        asperaInstaller.showUpdate();
      }
      if (data === status.RUNNING) {
        asperaInstaller.connected();
        callback(caller, spec, asperaWeb, id);
      }
    }
  };
  asperaWeb.addEventListener(AW4.Connect.EVENT.STATUS, statusEventListener);
  asperaWeb.initSession('nodeConnect-' + id);
}

//Handler for downloads.  'caller' is reference to HTML element who made the call (for updating progress) and 'spec' is the
//transferSpec returned from server.
//Starts Connect Client and starts transfer

function handleDownload(caller, spec)
{
  var random = Math.floor((Math.random() * 10000) + 1);
  initConnect(random, handleDownloadCallback, caller, spec);
}

var handleDownloadCallback = function (caller, spec, asperaWeb, random)
{
    //random is a random number used for creating multiple instances of downloads/uploads
    fileControls = {};
    var uready = false;

    //Progress bar handler
    fileControls.handleTransferEvents = function (event, returnObj) {
        var obj = returnObj.transfers[0];
        if(!obj)
        {
          obj = {};
        }
        //Wait for initiating status to avoid reading past events, 'uready' lets us know when we start
        if (obj.status == 'initiating' ||  obj.previous_status == 'initiating')
        {
            uready = true;
        }
        if (uready)
        {
			//Received failed, add red background to td and print error message.  Operation is done.
            if (obj.status == 'failed')
            {
                jQuery(caller).closest("td").children(".progressMessage").text('The Download Failed: ' + obj.error_desc + ' (' + obj.error_code + ')');
                jQuery(caller).closest("td").attr("style", "background-color: #f2dede;");
                failure(obj.error_desc + ' (' + obj.error_code + ')');
                uready = false;
            }

			//Received completed, add green background to td and print Complete message.  Operation is done.
            else if (obj.status == 'completed')
            {
                jQuery(caller).closest("td").children(".progressMessage").text("Download Complete");
                jQuery(caller).closest("td").attr("style", "background-color: #dff0d8;");
                uready = false;
                asperaWeb.removeEventListener('transfer');
            }
			//Transfer in progress, use gradient effect to show background moving (like loading bar).  Need to include gradient for all browsers.
            else
            {
                switch (event) {
                    case 'transfer':
                        jQuery(caller).closest("td").children(".progressMessage").text("Downloading (" + Math.floor(obj.percentage * 100) + "%)");
                        jQuery(caller).closest("td").attr("style", "background: -moz-linear-gradient(left, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%, rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%, rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%); background: -webkit-gradient(linear, left top, right top, color-stop(" + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,1)), color-stop(" + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(223,240,216,0)), color-stop(" + (Math.floor(obj.percentage * 100) + 2) + "%,rgba(255,255,255,0))); background: -webkit-linear-gradient(left, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%); background: -o-linear-gradient(left, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%); background: -ms-linear-gradient(left, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%); background: linear-gradient(to right, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%)");
                        break;
                }
            }
        }
    };
    asperaWeb.addEventListener('transfer', fileControls.handleTransferEvents);

    //Block Connect Dialog from appearing, since we are showing progress on web app
    connectSettings = {
        "allow_dialogs": "no"
    };

    //Start Download using Connect
    var transferSpecArray = JSON.parse(spec);
    var transferSpec = transferSpecArray.transfer_specs[0].transfer_spec;
    //Add token authentication tag to JSON since is it not returned with transferSpec.
    transferSpec.authentication = "token";
    transferSpec.remote_user = "aspera";  //*************** Vikas: This has to be mapped to backend user ********************
    asperaWeb.startTransfer(transferSpec, connectSettings);
}

//Handler for uploads. 'spec' is the transferSpec returned from server.
//Starts Connect Client and starts transfer
function handleUpload(spec)
{
  var random = Math.floor((Math.random() * 10000) + 1);
  initConnect(random, handleUploadCallback, undefined, spec);
}

var handleUploadCallback = function (caller, spec, asperaWeb, random)
{
	//random is a random number used for creating multiple instances of downloads/uploads
    fileControls = {};
    var uready = false;

	//Progress bar handler
    fileControls.handleTransferEvents = function (event, returnObj) {
        var obj = returnObj.transfers[0];
        if(!obj)
        {
          obj = {};
          jQuery("#upload-path").val("The upload has finished or was canceled.")
          uready = false;
        }
        //Wait for initiating status to avoid reading past events, 'uready' lets us know when we start
        if (obj.status == 'initiating' ||  obj.previous_status == 'initiating')
        {
            uready = true;
        }
        if (uready)
        {
			//Received failed, make background red and print error message.  Operation is done.
            if (obj.status == 'failed')
            {
                jQuery("#upload-path").val('The Upload Failed: ' + obj.error_desc + ' (' + obj.error_code + ')');
                jQuery("#upload-path").attr("style", "background-color: #f2dede;");
                failure(obj.error_desc + ' (' + obj.error_code + ')');
                uready = false;
            }

			//Received completed, make background green and print complete message.  Operation is done.
            else if (obj.status == 'completed')
            {
                jQuery("#upload-path").val("Uploading Complete");
                jQuery("#upload-path").attr("style", "background-color: #dff0d8;");
                uready = false;

                //Reimplement list of files
                changeDirectory(jQuery("#currentDirectory").text());
                asperaWeb.removeEventListener('transfer');
            }

			//Transfer in progress, use gradient effect to show background moving (like loading bar).  Need to include gradient for all browsers.
            else
            {
                switch (event) {
                    case 'transfer':
                        jQuery("#upload-path").val("Uploading (" + Math.floor(obj.percentage * 100) + "%)");
                        jQuery("#upload-path").attr("style", "background: -moz-linear-gradient(left, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%, rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%, rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%); background: -webkit-gradient(linear, left top, right top, color-stop(" + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,1)), color-stop(" + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(223,240,216,0)), color-stop(" + (Math.floor(obj.percentage * 100) + 2) + "%,rgba(255,255,255,0))); background: -webkit-linear-gradient(left, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%); background: -o-linear-gradient(left, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%); background: -ms-linear-gradient(left, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%); background: linear-gradient(to right, rgba(223,240,216,1) " + Math.floor(obj.percentage * 100) + "%,rgba(223,240,216,0) " + (Math.floor(obj.percentage * 100) + 1) + "%,rgba(255,255,255,0) " + (Math.floor(obj.percentage * 100) + 2) + "%)");
                        break;
                }
            }
        }
    };

    asperaWeb.addEventListener('transfer', fileControls.handleTransferEvents);

    //Block Connect Dialog from appearing, since we are showing progress on web app
    connectSettings = {
        "allow_dialogs": "no"
    };

    //Start Upload using Connect
    var transferSpecArray = JSON.parse(spec);
    var transferSpec = transferSpecArray.transfer_specs[0].transfer_spec;
    transferSpec.authentication = "token";
    transferSpec.remote_user = "aspera";  //*************** Vikas: This has to be mapped to backend user ********************

    //Show Select File dialog box and loop through each file to add it to path array.
    asperaWeb.showSelectFileDialog({success: function (pathArray) {
            var fileArray = pathArray.dataTransfer.files
            for (var i = 0; i < fileArray.length; i++)
            {
                transferSpec.paths[i] = {source: fileArray[i].name};
            }
            jQuery("#upload-path").val('Upload Starting');
            asperaWeb.startTransfer(transferSpec, connectSettings);
        }});
}

//Handler for delete. returnMessage is message from server.
//If it does not contain error than we continue
function handleDelete(returnMessage)
{
    //Check and see if return message contains error
	var jsonReturn = JSON.parse(returnMessage);
	if(jsonReturn.paths[0].error == null)
	{
		changeDirectory(jQuery("#currentDirectory").text());
	}
    else
    {
    	//Alert message to user
        alert("Failed To Delete:\n" + jsonReturn.paths[0].error.user_message);
    }
}

//Handler for delete. returnMessage is message from server.
//If it does not contain error than we continue
function handleDirCreate(returnMessage)
{
    //Check and see if return message contains error
	var jsonReturn = JSON.parse(returnMessage);
	if(jsonReturn.paths[0].error == null)
	{
		changeDirectory(jQuery("#currentDirectory").text());
	}
    else
    {
    	//Alert message to user
        alert("Failed To Create Directory:\n" + jsonReturn.paths[0].error.user_message);
    }
}

//Handler for delete. returnMessage is message from server.
//If it does not contain error than we continue
function handleRename(returnMessage)
{
    //Check and see if return message contains error
	var jsonReturn = JSON.parse(returnMessage);
	if(jsonReturn.paths[0].error == null)
	{
		changeDirectory(jQuery("#currentDirectory").text());
	}
    else
    {
    	//Alert message to user
        alert("Failed To Rename Item:\n" + jsonReturn.paths[0].error.user_message);
    }
}

//Handler for delete. returnMessage is message from server.
//If it does not contain error than we continue
function handleFileList(directoryListing, path)
{
    //Create our table for HTML (you could read in as any format for the front end)
    //Get Starting Directory
	var startDir = jQuery("#startingDirectory").text();
    var newListing = "";
    //Check if returned value is empty.  If so print empty message
    if ((directoryListing === undefined) || (directoryListing.items.length == 0))
    {
    	newListing = "<tr class='dirListingRow'><td colspan='5'>This directory is empty</td></tr>";
    }
	else
	{
		//Loop through each item returned.  counter is just for giving HTML items an unique id (you can make it start from anything depending on need)
		var counter = 0;
		for(var i=0; i < directoryListing.items.length; i++)
		{
			newListing += "<tr class='dirListingRow'>";
			//If not file we assume it is a directory
			if(directoryListing.items[i].type != "file")
			{
				newListing += '<td class="type-col"><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span></td>';
				newListing += '<td class="name-col"><a href="#" onclick="changeDirectory(\'' + directoryListing.items[i].path + '\');return false;">' + directoryListing.items[i].basename + '</a></td>';
				newListing += '<td class="size-col" alt="' + directoryListing.items[i].size + '">' + cleanSize(directoryListing.items[i].size) + '</td>';
				newListing += '<td class="mod-col" alt="' + directoryListing.items[i].mtime + '">' + cleanDate(directoryListing.items[i].mtime) + '</td>';
				newListing += '<td class="act-col"><div class="dropdown"><a href="#" dropdown-toggle" id="dropdownMenu-' + counter + '" data-toggle="dropdown" aria-expanded="true"><span class="glyphicon glyphicon-option-vertical"></span></a>';
				newListing += '<ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu-' + counter + '"><li role="presentation"><a role="menuitem" tabindex="-1" href="#" onclick="renameFile(\'' + directoryListing.items[i].path + '\');return false;">Rename</a></li><li role="presentation"><a role="menuitem" tabindex="-1" href="#" onclick="deleteFile(true, \'' + directoryListing.items[i].path + '\');return false;">Delete</a></li></ul></div></td>';
			}
			else
			{
				newListing += '<td class="type-col"><span class="glyphicon glyphicon-file" aria-hidden="true"></span></td>';
				newListing += '<td class="name-col"><a class="fileLink" href="#" onclick="downloadFile(this, \'' + directoryListing.items[i].path + '\');return false;">' + directoryListing.items[i].basename + '</a><span class="progressMessage"></span></td>';
				newListing += '<td class="size-col" alt="' + directoryListing.items[i].size + '">' + cleanSize(directoryListing.items[i].size) + '</td>';
				newListing += '<td class="mod-col" alt="' + directoryListing.items[i].mtime + '">' + cleanDate(directoryListing.items[i].mtime) + '</td>';
				newListing += '<td class="act-col"><div class="dropdown"><a href="#" dropdown-toggle" id="dropdownMenu-' + counter + '" data-toggle="dropdown" aria-expanded="true"><span class="glyphicon glyphicon-option-vertical"></span></a>';
				newListing += '<ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu-' + counter + '"><li role="presentation"><a role="menuitem" tabindex="-1" href="#" onclick="renameFile(\'' + directoryListing.items[i].path + '\');return false;">Rename</a></li><li role="presentation"><a role="menuitem" tabindex="-1" href="#" onclick="deleteFile(false, \'' + directoryListing.items[i].path + '\');return false;">Delete</a></li></ul></div></td>';
			}

			newListing += "</tr>";
			counter++;
		}

	}

    //If the directory is not at starting directory we need to show the back button
    if (path.toLowerCase() != startDir.toLowerCase())
    {
        //Break up new path to each folder for handling
        var pathArray = path.split("/");
        pathArray.pop();
        var prevDir = pathArray.join("/");
        if (prevDir == "") {
            prevDir = jQuery("#startingDirectory").text();
        }
        jQuery("#backButton").attr("onclick", "changeDirectory('" + prevDir + "');return false;");
        jQuery("#backDiv").animate({width: "100px"});
    }
    else
    {
    	//Hide back button since we are at starting directory
        jQuery("#backDiv").animate({width: "0px"});
    }
	jQuery("#currentDirectory").text(path);
    jQuery(".dirListingRow").remove();
    jQuery("#fileListTable").append(newListing);
}

//******************************************************
//Below are functions for the front end (Helper functions and GUI functions)
//Some functions are optional depending on need, however, if you remove them you need to remove any calls to them
//******************************************************

//Global error handling.  Use this whenever an error occurs. (Optional)
function failure(message)
{
	//For this example we print errors in footer, however, you may want to log them in Console
    jQuery("#log-data").text("An error occurred: " + message);
}

//Take the raw date from Node and make it a cleaner format (Optional)
//This version prints with US English (language and structure), you may need to change for your needs
//This function also takes the local time offset of the client and converts to local
function cleanDate(date)
{
    var cleanDate = "";
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var parts = date.split("T");
    var dateParts = parts[0].split("-");
    var timeParts = (parts[1].split("Z")[0]).split(":");
    //Create Date object in UTC to allow for proper timezone based on user
    var jsDate = new Date(Date.UTC(dateParts[0], parseInt(dateParts[1])-1, dateParts[2], timeParts[0], timeParts[1], timeParts[2]));
    var amPm = "AM";
    var hour = jsDate.getHours();
    if (hour >= 12)
    {
        amPm = "PM";
        hour = hour - 12;
    }
    if(hour == "00")
    {
    	hour = "12"
    }
    //Final Structure of entire date
    cleanDate = months[jsDate.getMonth()] + " " + jsDate.getDate() + ", " + jsDate.getFullYear() + " " + hour + ":" + jsDate.getMinutes() + ":" + jsDate.getSeconds() + " " + amPm;
    return cleanDate;
}

//Take the raw size from Node (bytes) and make it a cleaner format (Optional)
function cleanSize(size)
{
    if (size == 0)
    {
        return "";
    }
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    var base = Math.floor(Math.log(size) / Math.log(1000));
    return (size / Math.pow(1000, base)).toFixed(2) + ' ' + units[base];
}

//******************************************************
//Below are functions for the front end Sorting and Searching
//If you do not want to use Sorting or Searching you can delete this section
//******************************************************

//Compares either alt data or item text for sorting columns (Optional)
function compare(index) {
        return function (a, b) {
        if ((a.cells.item(index).hasAttribute("alt")) && (b.cells.item(index).hasAttribute("alt")))
        {
            var valA = a.cells.item(index).getAttribute("alt");
            var valB = b.cells.item(index).getAttribute("alt");
        }
        else
        {
                    	var valA = jQuery(a).children('td').eq(index).html();
            var valB = jQuery(b).children('td').eq(index).html()
        }
                return jQuery.isNumeric(valA) && jQuery.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
        }
}

//Search names of items.  If item does not match search it is hidden.  This triggers after every keystroke (including backspace) (Optional)
//If you change structure or class names you will need to change them here
function searchListings()
{
    var searchString = jQuery("#search-term").val().toLowerCase();
    jQuery("td.name-col").parent("tr").show();
    jQuery("td.name-col").each(function () {
        if (!((jQuery(this).text().toLowerCase()).indexOf(searchString) > -1))
        {
            jQuery(this).parent("tr").hide();
        }
    });
    if (jQuery("#fileListTable tbody").children(".dirListingRow:visible").length == 0)
    {
        //We need to print a message to tell user no results (not just list nothing)
        if (!(jQuery("#searchError").length))
        {
            jQuery("#fileListTable").append("<tr id='searchError'><td colspan='5'>Your search returned no results</td></tr>");
        }
    }
    else
    {
        //We now have results, remove error
        jQuery("#searchError").remove();
    }
}

//Clear the search box by emptying it and performing search again (which will show all) (Optional if not using Search)
function clearSearch()
{
    jQuery("#search-term").val("");
    searchListings();
    jQuery("#clearSearch").fadeOut("slow");
}

//******************************************************
//First Run Items
//This includes functions for initial load of the page
//******************************************************

//Document is ready start application
jQuery("document").ready(function ()
{
	//Get Starting Directory location to put on page.  This also gets the table data (after startingDirectory finishes)
   	getStartingDirectory();

    //Make headerRow clickable for sorting, if not using sorting remove this
    jQuery('.headerRow').click(function () {
            var table = jQuery(this).parents('table').eq(0);
            var rows = table.find('tr:gt(0)').toArray().sort(compare(jQuery(this).index()));
            this.asc = !this.asc;

        if (!(jQuery(this).children(".sort-icon").hasClass("sortFirst")) && !(jQuery(this).children(".sort-icon").hasClass("sortSecond")) && (table.hasClass("sortedTable")))
        {
            jQuery(".headerRow .sort-icon").removeClass("sortFirst");
            jQuery(".headerRow .sort-icon").removeClass("sortSecond");
        }

        if (jQuery(this).children(".sort-icon").hasClass("sortFirst"))
        {
            jQuery(this).children(".sort-icon").removeClass("sortFirst");
            jQuery(this).children(".sort-icon").addClass("sortSecond");
        }
        else if (jQuery(this).children(".sort-icon").hasClass("sortSecond"))
        {
            jQuery(this).children(".sort-icon").removeClass("sortSecond");
            jQuery(this).children(".sort-icon").addClass("sortFirst");
        }
        else
        {
            jQuery(this).children(".sort-icon").addClass("sortFirst");
            table.addClass("sortedTable");
        }
            if (!this.asc)
        {
            rows = rows.reverse()
        }
            for (var i = 0; i < rows.length; i++)
        {
            table.append(rows[i])
        }
    });

    //Trigger search event on keyup (we use keyup since it includes all including backspace)
    //If not using Search you can remove this
    jQuery('#search-term').bind('keyup', function (e) {

        //Show Clear Button
        jQuery("#clearSearch").fadeIn("slow");
        searchListings();
        if (jQuery("#search-term").val().length == 0)
        {
            jQuery("#clearSearch").fadeOut("slow");
        }
    });
});
