var jsonData;
var simpleJson = [];

function setUp()
{
	document.getElementById('fileinput').addEventListener('change', readFile, false);
    document.getElementById('jsonBtn').onclick = downloadJson;
}

function readFile(evt) {
    //Retrieve all the files from the FileList object
	var files = evt.target.files; 
	document.getElementById("fileNameTextBox").value = files[0].name;
	if (files) 
	{
		var reader = new FileReader();
		reader.readAsText(files[0]);
		
		reader.onload = function() 
		{
			jsonData = JSON.parse(reader.result);
            //console.log("Name: "+files[0].name);
			//console.log("Size: "+files[0].size+" Bytes");
			parseData();
		}
	}
	else 
    {
	      console.error("Failed to load files"); 
    }
}

function parseData()
{
    for (var i=0; i < jsonData.conversation_state.length; i++)
    {
        var conversation = {};
        conversation.participants = getParticipants(i);
        conversation.messages = [];
        
        for(var j=0; j < jsonData.conversation_state[i].conversation_state.event.length; j++)
        {
            var message = {};
            
            message.sender = getName(jsonData.conversation_state[i].conversation_state.event[j].sender_id.gaia_id, conversation.participants);
            var d = new Date(0); //0 means it sets the date to the epoch
            d.setUTCSeconds(Math.floor(jsonData.conversation_state[i].conversation_state.event[j].timestamp/1000000));//convert from microseconds to seconds
            
            message.unixtime = Math.floor(jsonData.conversation_state[i].conversation_state.event[j].timestamp/1000000);
            message.time = d;
            if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment !== undefined)
            {//if it's a normal hangouts message
                
                var content ="";
                for (var k = 0; k < jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment.length; k++)
                {
                    //console.log("Message: "+jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment[k].text);
                    content += jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment[k].text;
                }
                message.content = content;
            }
            
            
            else if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment !== undefined)
            {//if it's an image
                
                for (var k = 0; k < jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment.length; k++)
                {
                    message.content = jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment[k].embed_item["embeds.PlusPhoto.plus_photo"].url
                }
            }
            
            else
            {
                console.warn("%c Unknown format for conversation "+i+" message "+j+"", "background: #FF0000");
                message.content = "Unknown format, unable to parse message "+j+" in conversation "+i;
            }
            conversation.messages.push(message);
        }
        conversation.messages.sort(function(a, b) 
        {
            return parseFloat(a.unixtime) - parseFloat(b.unixtime);
        });
        simpleJson.push(conversation);
    }
    //console.dir(simpleJson);
    document.getElementById("jsonBtn").className = "btn btn-default";
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

function downloadJson()
{
    download("hangons.json", JSON.stringify(simpleJson, null, "\t"));
}

function download(filename, text) {
    var ele = document.createElement('a');
    ele.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    ele.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        ele.dispatchEvent(event);
    }
    else {
        ele.click();
    }
}


window.onload = setUp;
//As seen on http://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file