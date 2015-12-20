var jsonData;

function setUp()
{
	document.getElementById('fileinput').addEventListener('change', readFile, false);
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
			//console.dir(jsonData.conversation_state[0].conversation_state.event[23].chat_message.message_content.segment[0].text);
		}
	}
	else 
    {
	      console.warn("Failed to load files"); 
    }
}

function parseData()
{
    console.dir(jsonData);
    var i = 0;
    for (; i < jsonData.conversation_state.length; i++)
    {
        var j = 0;
        for(; j < jsonData.conversation_state[i].conversation_state.event.length; j++)
        {
            //console.log(j);
            if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment !== undefined)
            {//if it's a normal hangouts message
                var k = 0;
                for (; k < jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment.length; k++)
                {
                    console.log(jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment[k].text);
                }
            }
            
            
            else if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment !== undefined)
            {//if it's an message
                var k = 0;
                for (; k < jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment.length; k++)
                {
                    console.log(jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment[k].embed_item["embeds.PlusPhoto.plus_photo"].url);
                }
            }
            
            else
            {
                console.error("%c Unknown format for conversation "+i+" message "+j+"", "background: #FF0000");
            }
        }
    }
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

function test()
{
	var temp = "Messages";
	var title = "Hangons"+".txt";
	download(title, temp);
}

window.onload = setUp;
//As seen on http://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file