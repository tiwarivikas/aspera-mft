/**
 * Created by vikas on 5/21/2016.
 */
var CONNECT_INSTALLER =  "//d3gcli72yxqn2z.cloudfront.net/connect/v4";

var TokenAuth = {};
//TokenAuth.url = "http://devdemo.asperasoft.com:8233/AstokenGen/getToken";
TokenAuth.url = "http://localhost:8233/AstokenGen/getToken";
TokenAuth.timeout = 60000;

var $uploadContainer = "allUploadTransfers";
var $downloadContainer = "allDownloadTransfers";

function toggle(showHideDiv, switchTextDiv, displayText) {
    var ele = document.getElementById(showHideDiv);
    var text = document.getElementById(switchTextDiv);
    if(ele.style.display == "block") {
        ele.style.display = "none";
        text.innerHTML = "Show " + displayText;
    }
    else {
        ele.style.display = "block";
        text.innerHTML = "Hide " + displayText;
    }
}

function consoleLog(info) {
    try {
        if(console) {
            console.log(info);
        }
    }
    catch (e) {
        //Eat the exception. Only happend on IE 9 intermittently
    }
}

function insertButton(buttonValue, className, container, onclickFunction) {
    var iButton;
    iButton = document.createElement('input');
    iButton.type = 'button';
    iButton.value = buttonValue;
    iButton.className = className;

    iButton.setAttribute('onclick', onclickFunction);
    document.getElementById(container).appendChild(iButton);
}

var addToTable = function (container, name, transferSpec, connectSettings) {
    var subcontainer = document.createElement('tr');
    subcontainer .setAttribute('style','border: gray 0px dashed; text-align:center; align:center');
    subcontainer.setAttribute('id', name);

    /********************************************************/
    var bar = document.createElement('div');
    bar.setAttribute('id','p_' + name);
    bar.setAttribute('class',"easyui-progressbar progressbar");
    bar.setAttribute('style','text-align:center; width: 100%; align:center;');

    var barTh = document.createElement('th');
    barTh.setAttribute('id','thp_' + name);
    barTh.setAttribute('class',"nobg");

    /******************************************************/
    var text = document.createElement('div');
    text.setAttribute('id','file_name_' + name);
    text.setAttribute('style','text-align: center;word-wrap: break-word;');

    var textTh = document.createElement('th');
    textTh.setAttribute('id','thfile_name_' + name);
    textTh.setAttribute('class',"nobg");


    /*****************************************************/
    var pause = document.createElement('input');
    pause.type = 'button';
    pause.setAttribute('id','pause_' + name);
    pause.setAttribute('name','Pause');
    pause.setAttribute('value','Pause');

    var remove = document.createElement('input');
    remove.type = 'button';
    remove.setAttribute('id','remove_' + name);
    remove.setAttribute('value','Remove');

    var tsjson = document.createElement('input');
    tsjson.type = 'button';
    tsjson.setAttribute('id','tsjson_' + name);
    tsjson.setAttribute('value','Show TransferSpec');

    var resjson = document.createElement('input');
    resjson.type = 'button';
    resjson.setAttribute('id','resjson_' + name);
    resjson.setAttribute('value','Show Progress JSON');

    var buttonTh = document.createElement('th');
    buttonTh.setAttribute('id','thbutton_' + name);
    buttonTh.setAttribute('class',"nobg");

    /********** update the DOM **********************/
    document.getElementById(container).appendChild(subcontainer);
    $('#'+name).append(barTh);
    $('#'+name).append(textTh);
    $('#'+name).append(buttonTh);
    $('#thp_'+name).append(bar);
    $('#thfile_name_'+name).append(text);
    $('#thbutton_'+name).append(pause);
    $('#thbutton_'+name).append(remove);
    $('#thbutton_'+name).append(resjson);
    $('#thbutton_'+name).append(tsjson);

    /****************** start hidden *****************/
    var jsonTS = document.createElement('span');
    jsonTS.setAttribute('id','json_' + name);
    jsonTS.setAttribute('style','display:none');

    var jsonResult = document.createElement('span');
    jsonResult.setAttribute('id','jresult_' + name);
    jsonResult.setAttribute('style','display:none');

    var span = document.createElement('span');
    span.setAttribute('id','span_' + name);
    span.setAttribute('style','display:none');

    $('#'+name).append(jsonTS);
    $('#'+name).append(jsonResult);
    $('#'+name).append(span);
    /****************** end hidden *****************/

    /***************** button functions ***********/
    $("#pause_"+name).click(function(e) {
        var currentElement = $(this);
        var transferId = $('#span_'+name).text();
        if ( $(this).val() === "Pause" ) {
            var callbacks = {success: function(result) {
                consoleLog("Paused transfer id : " + transferId + " " + JSON.stringify(result, null, 4));
                if (result) {
                    currentElement.val('Resume');
                }
            }
            };
            xferControls.stopTransfer(transferId, callbacks);
        } else {
            var callbacks = {success: function(result) {
                consoleLog("Resume transfer id : " + transferId + " " + JSON.stringify(result, null, 4));
                if (result) {
                    currentElement.val('Pause');
                }
            }
            };
            xferControls.resumeTransfer(transferId, callbacks);
        }
        e.preventDefault();
    });
    $("#remove_"+name).click(function(e) {
        xferControls.cancelTransfer(name, $('#span_'+name).text());
        e.preventDefault();
    });
    $("#tsjson_"+name).click(function(e) {
        if( $(this).val() === "Show TransferSpec" ) {
            xferControls.showTransferSpecJSON(name);
            $( this ).val('Hide TransferSpec');
        } else {
            xferControls.hide($('#transfer_spec'));
            $( this ).val('Show TransferSpec');
        }
        e.preventDefault();
    });
    $("#resjson_"+name).click(function(e) {
        if( $(this).val() === "Show Progress JSON" ) {
            xferControls.showResultJSON(name);
            $( this ).val('Hide Progress JSON');
        } else {
            xferControls.hide($('#progress_json'));
            $( this ).val('Show Progress JSON');
        }
        e.preventDefault();
    });

    $("#p_" + name).progressbar({'value':0});
    $("#json_" + transferSpec.cookie).text("transfer_spec " + JSON.stringify(transferSpec, null, 4) +
        " connect_settings " + JSON.stringify(connectSettings, null, 4));
};

getTransferEvents = function (iterationToken) {
    var callbacks = {
        success: function(allXfers) {
            if(typeof allXfers.error === 'undefined') {
                var resultcount = allXfers.result_count;
                var xfers = allXfers.transfers;
                for (var i=0; i < resultcount; i++) {
                    var container;
                    var toggleG;
                    var download = true;
                    if(xfers[i].transfer_spec.direction === "send") {
                        download = false;

                    }

                    if(download) {
                        container = $downloadContainer;
                        toggleG = $('#downloads_group');
                    } else {
                        container = $uploadContainer;
                        toggleG = $('#uploads_group');
                    }
                    //insert elements into table
                    addToTable(container,
                        xfers[i].transfer_spec.cookie,
                        xfers[i].transfer_spec,
                        xfers[i].aspera_connect_settings);
                    toggleG.show();
                    if(xfers[i].status === "cancelled") {
                        $("#pause_"+xfers[i].transfer_spec.cookie).val('Resume');
                    } else if (xfers[i].status === "completed") {
                        $("#pause_"+xfers[i].transfer_spec.cookie).hide();
                    }
                }
            }
        }
    }
    asperaWeb.getAllTransfers(iterationToken, callbacks);
};

var initAsperaConnect  = function () {
    /* This SDK location should be an absolute path, it is a bit tricky since the usage examples
     * and the install examples are both two levels down the SDK, that's why everything works
     */
    this.asperaWeb = new AW4.Connect({sdkLocation: CONNECT_INSTALLER, minVersion: "3.6.0"});
    var asperaInstaller = new AW4.ConnectInstaller({sdkLocation: CONNECT_INSTALLER});
    var statusEventListener = function (eventType, data) {
        if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.INITIALIZING) {
            asperaInstaller.showLaunching();
        } else if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.FAILED) {
            asperaInstaller.showDownload();
        } else if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.OUTDATED) {
            asperaInstaller.showUpdate();
        } else if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.RUNNING) {
            asperaInstaller.connected();
        }
    };
    asperaWeb.addEventListener(AW4.Connect.EVENT.STATUS, statusEventListener);
    asperaWeb.addEventListener(AW4.Connect.EVENT.TRANSFER, fileControls.handleTransferEvents);
    asperaWeb.initSession();

    $("#upload_files_button").click(function(e) {
        asperaWeb.showSelectFileDialog({success:fileControls.uploadFiles},
            options = {
                //disable multiple files selection if token authorization is used
                allowMultipleSelection : ($('input[name=allow_multiple_files]').is(':checked'))
            });
        e.preventDefault();
    });

    $("#upload_directory_button").click(function(e) {
        asperaWeb.showSelectFolderDialog({success:fileControls.uploadFiles},
            options = {
                //disable multiple files selection if token authorization is used
                allowMultipleSelection : ($('input[name=allow_multiple_files]').is(':checked'))
            });
        e.preventDefault();
    });

    $("#download_button_200KB").click(function(e) {
        fileControls.selectFolder("aspera-test-dir-tiny/200KB.1");
        e.preventDefault();
    });

    $("#download_button_100MB").click(function(e) {
        fileControls.selectFolder("aspera-test-dir-large/100MB");
        e.preventDefault();
    });

    $("#download_button_500MB").click(function(e) {
        fileControls.selectFolder("aspera-test-dir-large/500MB");
        e.preventDefault();
    });

    $("#download_button_1GB").click(function(e) {
        fileControls.selectFolder("aspera-test-dir-large/1GB");
        e.preventDefault();
    });
    this.asperaWeb.addEventListener('transfer', fileControls.handleTransferEvents);

    //to start, get all transfers and display them
    getTransferEvents();
};

fileControls = {};

fileControls.handleTransferEvents = function (event, transfersJsonObj) {
    consoleLog(JSON.stringify(transfersJsonObj, null, "        "));
    switch (event) {
        case 'transfer':
            for (var i = 0; i < transfersJsonObj.result_count; i++) {
                var tranfer = transfersJsonObj.transfers[i];

                var cookie = tranfer.transfer_spec.cookie;
                $('#p_'+cookie).progressbar('setValue', Math.floor(tranfer.percentage * 100));

                var info = tranfer.current_file;
                if(tranfer.status === "failed") {
                    info = tranfer.title + ": " + tranfer.error_desc;
                } else if(tranfer.status === "completed") {
                    $("#pause_"+cookie).hide();
                    info = tranfer.title;
                }
                $("#file_name_"+cookie).text(tranfer.transfer_spec.direction + " - " + info);

                $("#jresult_"+cookie).text(JSON.stringify(tranfer, null, 4));
                $('#span_'+cookie).text(tranfer.transfer_spec.tags.aspera.xfer_id);
            }
            break;
    }
};

fileControls.transfer = function(transferSpec, connectSettings, token) {
    if (typeof token !== "undefined" && token !== "") {
        transferSpec.authentication="token";
        transferSpec.token=token;
    }

    asperaWeb.startTransfer(transferSpec, connectSettings,
        callbacks = {
            error : function(obj) {
                consoleLog("Failed to start : " + JSON.stringify(obj, null, 4));
            },
            success:function () {
                var container;
                var toggleG;
                var download = true;
                if(transferSpec.direction === "send") {
                    download = false;
                }

                if(download) {
                    container = $downloadContainer;
                    toggleG = $('#downloads_group');
                } else {
                    container = $uploadContainer;
                    toggleG = $('#uploads_group');
                }
                //insert elements into table
                addToTable(container, transferSpec.cookie, transferSpec, connectSettings);
                toggleG.show();
                consoleLog("Started transfer : " + JSON.stringify(transferSpec, null, 4));
            }
        });
};

fileControls.getTokenBeforeTransfer = function(transferSpec, connectSettings, path, download) {
    var params = {};
    params.username = transferSpec.remote_user;
    params.path=path;
    var dir;
    if(download) {
        params.direction = "download";
        dir = "download";
    } else {
        params.direction = "upload";
        dir = "upload";
    }
    var jqxhr = $.ajax({
        type : "GET",
        contentType: 'application/json',
        cache : false,
        url : TokenAuth.url,
        data : params,
        dataType: "jsonp",
        timeout : TokenAuth.timeout,
        beforeSend : function() {
        },
        error : function(xhr, textStatus) {
            consoleLog("ERR: Failed to generate token " + textStatus);
        },
        success : function(data, textStatus, jqXHR) {
            var jsonValue = JSON.stringify(data);
            consoleLog("Got token " + jsonValue);
            var token = jsonValue.token;
            if(token !== "") {
                fileControls.transfer(transferSpec, connectSettings, token);
            } else {
                consoleLog("Error while retrieving data. Failed to generate token " + textStatus);
            }
        },
        complete : function(jqXHR, texStatus) {
        }
    });
};

fileControls.uploadFiles = function (dataTransferObj) {
    transferSpec = {
        "paths": [],
        "remote_host": "demo.asperasoft.com",
        "remote_user": "aspera",
        "remote_password": "demoaspera",
        "direction": "send",
        "target_rate_kbps" : 5000,
        "resume" : "sparse_checksum",
        "destination_root": "/Upload",
        "cookie" : "u-"+new Date().getTime()
    };
    var files = dataTransferObj.dataTransfer.files;
    for (var i = 0, length = files.length; i < length; i +=1) {
        transferSpec.paths.push({"source":files[i].name});
    }

    if (transferSpec.paths.length === 0) {
        return;
    }

    connectSettings = {
        "allow_dialogs": "no"
    };

    var tokenAuth = $('input[name=token_authorization]').is(':checked');
    consoleLog("Need authorization token for upload: " + tokenAuth);
    if(tokenAuth) {
        fileControls.getTokenBeforeTransfer(transferSpec, connectSettings, files[0].name, false);
    } else {
        fileControls.transfer(transferSpec, connectSettings, "");
    }
};


fileControls.downloadFile = function (sourcePath, destinationPath) {
    transferSpec = {
        "paths": [],
        "remote_host": "demo.asperasoft.com",
        "remote_user": "aspera",
        "remote_password": "demoaspera",
        "direction": "receive",
        "target_rate" : 5000,
        "allow_dialogs" : true,
        "cookie" : "d-"+new Date().getTime(),
        "destination_root": destinationPath
    };

    var path;
    path = {"source":sourcePath};
    transferSpec.paths.push(path);

    connectSettings = {
        "allow_dialogs": false,
        "use_absolute_destination_path": true
    };


    var tokenAuth = $('input[name=token_authorization]').is(':checked');
    consoleLog("Need authorization token for download: " + tokenAuth);
    if(tokenAuth) {
        fileControls.getTokenBeforeTransfer(transferSpec, connectSettings, transferSpec.paths[0].source, true);
    } else {
        fileControls.transfer(transferSpec, connectSettings, "");
    }
};

/**
 * Open a file selection dialog to choose the destination folder for download
 */
fileControls.selectFolder = function (sourcePath) {
    asperaWeb.showSelectFolderDialog(
        callbacks = {
            error : function(obj) {
                consoleLog("Destination folder selection cancelled. Download cancelled.");
            },
            success:function (dataTransferObj) {
                var files = dataTransferObj.dataTransfer.files;
                if (files !== null && typeof files !== "undefined" && files.length !== 0) {
                    destPath = files[0].name;
                    consoleLog("Destination folder for download: " + destPath);
                    fileControls.downloadFile(sourcePath, destPath);
                }
            }
        },
        //disable the multiple selection.
        options = {
            allowMultipleSelection : false,
            title : "Select Destination Folder"
        });
};

xferControls = {};

xferControls.stopTransfer = function (transferId, callbacks) {
    if(!(typeof transferId === 'undefined' || transferId == null)) {
        var result = asperaWeb.stopTransfer(transferId, callbacks);
    }
};

xferControls.resumeTransfer = function (transferId, callbacks) {
    if(!(typeof transferId === 'undefined' || transferId == null)) {
        var result = asperaWeb.resumeTransfer(transferId, null, callbacks);
    }
};

xferControls.cancelTransfer = function (cookie, transferId) {
    if(!(typeof transferId === 'undefined' || transferId == null)) {
        var result = asperaWeb.removeTransfer(transferId);
        $("#"+cookie).remove();
        consoleLog("Removed transfer id : " + transferId + " " + JSON.stringify(result, null, 4));
    }
};

xferControls.showResultJSON = function (cookie) {
    document.getElementById('progress_json').innerHTML = $("#jresult_"+cookie).text();
    $('#progress_json').show();
};

xferControls.showTransferSpecJSON = function (cookie) {
    document.getElementById('transfer_spec').innerHTML = $("#json_" + cookie).text();
    $('#transfer_spec').show();
};

xferControls.hide = function (element) {
    element.hide();
};