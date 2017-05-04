var jsonData;
var simpleJson = [];
var files = [];

function setUp()
{
    document.getElementById('fileinput').addEventListener('change', readFile, false);
    document.getElementById('jsonBtn').onclick = downloadJson;
    document.getElementById('txtBtn').onclick = toTxt;
    document.getElementById('csvBtn').onclick = toCsv;
    document.getElementById('htmlBtn').onclick = toHtml;
}

function readFile(evt) 
{
    //Retrieve all the files from the FileList object
    document.getElementById("cannotParseAlert").className = "row hidden";
    document.getElementById("unknownMessageAlert").className = "row hidden";
    document.getElementById("parseBar").style.width = "0%";
    
    var files = evt.target.files; 
    document.getElementById("fileNameTextBox").value = files[0].name;
    if (files) 
    {
        var reader = new FileReader();
        reader.readAsText(files[0]);
        reader.onload = function() 
        {
            try 
            {
                jsonData = JSON.parse(reader.result);
                parseData();
            } 
            catch (err) 
            {
                console.warn(err);
                if (files[0].name === "Hangouts.json")
                {
                    if (err.__proto__.name === "SyntaxError")
                    {
                        document.getElementById("cannotParseAlertDes").innerText = "The Hangouts.json file seems to "+
                        "contain invalid JSON. Perhaps try download it from Google takeout again?";
                    }
                    else
                    {
                        document.getElementById("cannotParseAlertDes").innerHTML = "The Hangouts.json file contains data which "+
                        "cannot be read. If you could copy the error code: <br> err.message <br>and report it "+
                        "<a href='https://docs.google.com/forms/d/1YEmJ5ScZbtJ6_U6RtpCLdhoSZs1i6kMipM0jVOBQnpc/viewform?usp=send_form'>"+
                        "here</a> I will try fix it.";
                    }
                }
                else
                {
                    document.getElementById("cannotParseAlertDes").innerText = "Are you sure it was the Hangouts.json file you chose?";
                }
                document.getElementById("cannotParseAlert").className = "row";
            }
        }
    }
    else 
    {   
        console.error("Failed to load files"); 
    }
}

function parseData()
{
    var progress = 0;
    for (var i=0; i < jsonData.conversation_state.length; i++)
    {
        var conversation = {};
        conversation.chatName = "";
        conversation.participants = getParticipants(i);
        conversation.messages = [];
        
        for(var j=0; j < jsonData.conversation_state[i].conversation_state.event.length; j++)
        {
            var message = {};
            message.sender = {};
            message.sender.name = getName(jsonData.conversation_state[i].conversation_state.event[j].sender_id.gaia_id, conversation.participants);
            message.sender.id = jsonData.conversation_state[i].conversation_state.event[j].sender_id.gaia_id;
            message.unixtime = Math.floor(jsonData.conversation_state[i].conversation_state.event[j].timestamp/1000000);
            if(jsonData.conversation_state[i].conversation_state.event[j].chat_message !== undefined)
            {//if it's a message (normal hangouts, image...)
                if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment !== undefined)
                {//if it's a normal hangouts message
                    
                    var content ="";
                    for (var k = 0; k < jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment.length; k++)
                    {
                        content += jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment[k].text;
                    }
                    message.content = content;
                }
                
                else if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment !== undefined)
                {
                    for (var k = 0; k < jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment.length; k++)
                    {
                        //image
                        if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment.type == "PLUS_PHOTO")
                                message.content = jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment[k].embed_item["embeds.PlusPhoto.plus_photo"].url
                        //audio
                        else if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment.type == "PLUS_AUDIO_V2")
                                message.content = jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment[k].embed_item["embeds.PlusAudioV2.plus_audio_v2"].url


                    }
                }
                
                else
                {//if we don't recognise the format of the message
                    console.warn("%c Unknown format for conversation "+i+" message "+j+"", "background: #FF0000")
                    console.dir(jsonData.conversation_state[i].conversation_state.event[j]);
                    message.content = "Unknown format, unable to parse message "+j+" in conversation "+i;
                    document.getElementById("unknownMessageAlert").className = "row";
                }
            }
            else if (jsonData.conversation_state[i].conversation_state.event[j].conversation_rename)
            {//else if it's renaming the group
                message.content = "Changed group chat name to "+jsonData.conversation_state[i].conversation_state.event[j].conversation_rename.new_name;
            }
            else if (jsonData.conversation_state[i].conversation_state.event[j].hangout_event)
            {//else if it's a call using gangouts
                if (jsonData.conversation_state[i].conversation_state.event[j].hangout_event.event_type === "START_HANGOUT")
                {
                    message.content = "Started a Hangout";
                }
                else if (jsonData.conversation_state[i].conversation_state.event[j].hangout_event.event_type === "END_HANGOUT")
                {
                    message.content = "Ended a Hangout";
                }
            }
            else 
            {//if it's not a message or renaming the group
               console.warn("%c Unknown format for conversation "+i+" message "+j+"", "background: #FF0000");
               console.dir(jsonData.conversation_state[i].conversation_state.event[j]);
               message.content = "Unknown format, unable to parse message "+j+" in conversation "+i;
               document.getElementById("unknownMessageAlert").className = "row";
            }
            conversation.messages.push(message);
            progress += ((1/jsonData.conversation_state.length)*(1/jsonData.conversation_state[i].conversation_state.event.length)*100);
            document.getElementById("parseBar").style.width = Math.floor(progress)+"%";
        }
        conversation.messages.sort(function(a, b) 
        {
            return parseFloat(a.unixtime) - parseFloat(b.unixtime);
        });
        simpleJson.push(conversation);
        simpleJson[i].chatName = nameFile(i);
    }
    files = [];
    document.getElementById("jsonBtn").className = "btn btn-default colouredButton";
    document.getElementById("txtBtn").className = "btn btn-default colouredButton";
    document.getElementById("csvBtn").className = "btn btn-default colouredButton";
    document.getElementById("htmlBtn").className = "btn btn-default colouredButton";
    document.getElementById("parseBar").style.width = "100%";
}

function getParticipants(index)
{
    var participants = [];
    for (var i = 0; i < jsonData.conversation_state[index].conversation_state.conversation.participant_data.length; i++)
    {
        var person = {};
        person.id = jsonData.conversation_state[index].conversation_state.conversation.participant_data[i].id.gaia_id;
        if (jsonData.conversation_state[index].conversation_state.conversation.participant_data[i].fallback_name !== undefined)
        {
            person.name = jsonData.conversation_state[index].conversation_state.conversation.participant_data[i].fallback_name;
        }
        else 
        {
            person.name = jsonData.conversation_state[index].conversation_state.conversation.participant_data[i].id.gaia_id;
        }
        participants.push(person);
    }
    return participants;
}

function getName(id, participants)
{
    for (var i = 0; i < participants.length; i++)
    {
        if(id === participants[i].id)
        {
            return participants[i].name;
        }
    }
    console.warn("Name not found for "+id+" in");
    console.dir(participants);
    return id;
}

function toTxt()
{
    files = [];
    document.getElementById("toFileBar").style.width = "0%";
    var progress = 0;
    for (var i=0; i < simpleJson.length; i++)
    {
        var conversation = {};
        conversation.type = ".txt";
        conversation.name = nameFile(i);
        conversation.messages = "";
        for (var j=0;j< simpleJson[i].messages.length; j++)
        {
            conversation.messages += simpleJson[i].messages[j].sender.name +" at "+unixToReadable(simpleJson[i].messages[j].unixtime)+
            " sent: "+simpleJson[i].messages[j].content+"\r\n";
            progress += (1/simpleJson.length)*(1/simpleJson[i].messages.length)*100;
            document.getElementById("toFileBar").style.width = Math.floor(progress)+"%";
        }
        files.push(conversation);
    }
    angular.element(document.getElementById('body')).scope().showFiles();
    document.getElementById("toFileBar").style.width = "100%";
}

function toCsv()
{
    files = [];
    document.getElementById("toFileBar").style.width = "0%";
    var progress = 0;
    for (var i=0; i < simpleJson.length; i++)
    {
        var conversation = {};
        conversation.type = ".csv";
        conversation.name = nameFile(i);
        conversation.messages = "";
        for (var j=0;j< simpleJson[i].messages.length; j++)
        {
            conversation.messages += simpleJson[i].messages[j].sender.name +","+unixToReadable(simpleJson[i].messages[j].unixtime)+
            ","+simpleJson[i].messages[j].content+"\r\n";
            progress += (1/simpleJson.length)*(1/simpleJson[i].messages.length)*100;
            document.getElementById("toFileBar").style.width = Math.floor(progress)+"%";
        }
        files.push(conversation);
    }
    angular.element(document.getElementById('body')).scope().showFiles();
    document.getElementById("toFileBar").style.width = "100%";
}

function toHtml()
{
    files = [];
    document.getElementById("toFileBar").style.width = "0%";
    var progress = 0;
    for (var i=0; i < simpleJson.length; i++)
    {
        var conversation = {};
        conversation.type = ".html";
        conversation.name = nameFile(i);
        conversation.messages = "<!DOCTYPE html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>"+
        "<title>Hangons Backup</title><link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>"+
        "<style>body{background-color: #ECEFF1;font-family: 'Roboto', sans-serif;}"+"\r\n"+
        ".m{padding: 10px;margin: 2px;display: inline-block;border-radius:10px;max-width: 77vw;}"+"\r\n"+
        ".s{border-top-right-radius: 0px;float:right;background-color: #CFD8DC;}"+"\r\n"+
        ".r{border-top-left-radius: 0px;float:left;background-color: #ffffff;}"+"\r\n"+
        ".d{font-size: x-small;}"+"\r\n"+
        ".c{float:left;border-radius: 50%;width: 20px;height: 20px;background-color: #1AA260;color: white;text-align: center;}"+"\r\n"+
        ".nl{clear: both;float: left;display: block;position: relative;}"+"\r\n"+
        "</style></head><body id='body'>";
        for (var j=0;j< simpleJson[i].messages.length; j++)
        {
            conversation.messages += getLetterCircle(i,simpleJson[i].messages[j].sender) +"<div class='m "
            +getMessageClass(i,simpleJson[i].messages[j].sender)+"'>"+
            simpleJson[i].messages[j].content+"<div class='d'>"+simpleJson[i].messages[j].sender.name +", "
            +unixToReadable(simpleJson[i].messages[j].unixtime)+"</div></div>"+"\r\n <div class='nl'></div>";
            
            progress += (1/simpleJson.length)*(1/simpleJson[i].messages.length)*100;
            document.getElementById("toFileBar").style.width = Math.floor(progress)+"%";
        }
        conversation.messages+="</body></html>";
        files.push(conversation);
    }
    angular.element(document.getElementById('body')).scope().showFiles();
    document.getElementById("toFileBar").style.width = "100%";
}

function getLetterCircle(i, sender)
{
    if (sender.id === jsonData.conversation_state[i].conversation_state.conversation.self_conversation_state.self_read_state.participant_id.gaia_id)
    {
        return "";
    }
    return "<div class='c'>"+sender.name.charAt(0)+"</div>";
}

function getMessageClass(i, sender)
{
    if (sender.id === jsonData.conversation_state[i].conversation_state.conversation.self_conversation_state.self_read_state.participant_id.gaia_id)
    {
        return "s";
    }
    return "r";
}

function unixToReadable(unix)
{
    var d = new Date(0); //0 means it sets the date to the epoch
    d.setUTCSeconds(unix);
    return(d.toLocaleTimeString() +", "+ d.toDateString());
}

function nameFile(i)
{
    if ((jsonData.conversation_state[i].conversation_state.conversation.name !== undefined)&&
        (jsonData.conversation_state[i].conversation_state.conversation.name != ""))
    {
        return jsonData.conversation_state[i].conversation_state.conversation.name;
    }
    var participants = [];
    var index;
    for (var k=0; k < simpleJson[i].participants.length; k++)
    {
        participants[k] = simpleJson[i].participants[k].name;
        if (simpleJson[i].participants[k].id === jsonData.conversation_state[i].conversation_state.conversation.self_conversation_state.self_read_state.participant_id.gaia_id)
        {
            index = k;
        }
    }
    var client = participants.splice(index, 1);
    var name = participants.toString();
    participants.splice(index, 0, client);//Puts the person's name back into the array
    return name;
}

function downloadJson()
{
    document.getElementById("toFileBar").style.width = "0%";
    download("hangons.json", JSON.stringify(simpleJson, null, "\t"));
    document.getElementById("toFileBar").style.width = "100%";
}

function download(filename, text) {
    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

var hangons = angular.module('hangons', []);
hangons.controller('mainController', function ($scope)
{
    $scope.showFiles=function()
    {
        $scope.angFiles = files;
        $scope.$apply();
    };
    
    $scope.angDownload=function(fileName, fileValue)
    {
        download(fileName, fileValue);
    }
    
    $scope.testAngular=function()
    {
        alert("test Passed");
    }
});

window.onload = setUp;
