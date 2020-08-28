
var myArgs = process.argv.slice(2);
if (myArgs.length !== 2) {
    console.error('Usage: node parse.js [raw subtitle json file] [subtitle control json file] ');
}

fs = require('fs');

try {

    // This json is directly retrieved from google cloud
    // curl -X GET -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) https://videointelligence.googleapis.com/v1/projects/637000999429/locations/us-east1/operations/10391224840668257911 > Q6.json
    // Before we can get the json file from the server, we need to upload the mp4 to google cloud and make sure
    // it's accessible (e.g. public) and do create a request.json as such:
    // the following:
    // {
    //   "inputUri": "URI",  <<- fill this out
    //   "features": ["TEXT_DETECTION"],
    //   "videoContext": {
    //     "textDetectionConfig": {
    //       "languageHints": ["en-US"] <<- make sure this is correct
    //     }
    //   }
    // }
    // Then, do the following in bash:
    // 
    // curl -X POST -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) -H "Content-Type: application/json; charset=utf-8" -d @request.json https://videointelligence.googleapis.com/v1/videos:annotate
    // Don't forget the set up the credential:
    // export GOOGLE_APPLICATION_CREDENTIALS="PATH-TO-CRED.json"
    
    var data = fs.readFileSync(myArgs[0], 'utf8')
    var raw = JSON.parse(data);
    var trans = raw.response.annotationResults[0].speechTranscriptions;

    // this is all the words from the video    
    var wordlib = combine(trans);
    // require('fs').writeFile(
    // 	'./wordlib.json',
    // 	JSON.stringify(wordlib),
    // 	function (err) {
    //         if (err) {
    // 		console.error('Crap happens');
    //         }
    // 	}
    // );
    
    // console.log(wordlib);

    // sub file is what the actual subtitle lines you'd like to have
    // This is where you can control the length of each subtitle line
    // @todo: can this be generated automatically?
    // right now, this is half manually:
    // 1st:
    // cat Q6.json | jq '.response.annotationResults[].speechTranscriptions[].alternatives[].transcript' > Q6_sub.json
    // Then, manually construct a json file such as:
    // {"trans": ["line1", "line2"]}
    
    
    var subfile = fs.readFileSync(myArgs[1], 'utf8');
    var subf = JSON.parse(subfile).trans;

    var subs = [];
    for (su of subf) {
	var text = su;
	var sub = makeSubLib(text, wordlib);	
	subs.push(sub);
    }

    // subs is an array of sub object {start, end, text}
    genSub(subs);
    
} catch (err) {
    console.error(err)
}

// Wrap string with two digits
function wrap(s) {
    return s.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})
}

// Covert duration to HH::MM::SS format
function duration(s) {
    var hr = Math.round(s/3600);
    var min = Math.round(s/60)%60;
    var sec = Math.round(s%60); // @todo: round up or down? 
    return wrap(hr) + ":" + wrap(min) + ":" + wrap(sec) + ",000";
}

// Emit the subtitles to console
function genSub(subs) {
    var i = 1;
    for (s of subs) {
	var startTime = duration(s.start.replace(/s$/, ""));
	var endTime = duration(s.end.replace(/s$/, ""));	

	console.log(i++);
	console.log(startTime + " --> " + endTime);
	console.log(s.text);
	console.log("\n");
    }
}

function combine(trans) {
    var res = []
    for (t of trans) {
	res = res.concat(t.alternatives[0].words);
    }
    return res;
}

// Find which alternative is the correct one for the current subtitle line
function getCorrectTran(text, trans) {
    for (t of trans) {
	var te = t.alternatives[0].transcript.trim();
	if (te.includes(text)) {
	    return t;
	}
    }
    console.error("Error");
    return trans[0];
}

// Given a subtitle line, create a sub object that contains the line and start and end time
function makeSubLib(text, words) {
    console.log(words[0]);
    var sub = {text: "", start: "", end : ""};
    sub.text = text;
    sub.start = words[0].startTime;
    
    var sentence = "";
    var i = 0;
    for (w of words) {
	i++;
	sentence = sentence + " " + w.word;
	if (text.trim().localeCompare(sentence.trim()) == 0) {
	    sub.end = w.endTime;
	    break;
	}
    }
    
    // remove it in the words. This is in place removal
    words.splice(0, i);
    return sub;
}

function makeSub(text, tran) {
    var words = tran.alternatives[0].words;
    var sub = {text: "", start: "", end : ""};
    sub.text = text;
    sub.start = words[0].startTime;
    
    var sentence = "";
    var i = 0;
    for (w of words) {
	i++;
	sentence = sentence + " " + w.word;
	if (text.trim().localeCompare(sentence.trim()) == 0) {
	    sub.end = w.endTime;
	    break;
	}
    }
    
    // remove it in the words. This is in place removal
    words.splice(0, i);
    return sub;
}
