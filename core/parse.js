try {
    var myArgs = process.argv.slice(2);
    if (myArgs.length !== 2) {
	console.error('Usage: node parse.js [raw subtitle json] [subtitle control json] ');
    }
    
    fs = require('fs');    
    var data = fs.readFileSync(myArgs[0], 'utf8')
    var wordlib = JSON.parse(data);
    // var trans = raw.response.annotationResults[0].speechTranscriptions;

    // this is all the words from the video    
    // var wordlib = combine(trans);
    
    // sub file is what the actual subtitle lines you'd like to have
    // This is where you can control the length of each subtitle line
    var subfile = fs.readFileSync(myArgs[1], 'utf8');
    var subf = JSON.parse(subfile).trans;

    var subs = [];
    for (su of subf) {
	var text = autoBreak(su);
	for (t of text) {
	    var sub = makeSubLib(t, wordlib);
	    subs.push(sub);
	}
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
    const hr = Math.floor(s/3600);
    const min = Math.floor(s/60)%60;
    const sec = Math.round(s%60);
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
	console.log(s.text.trim());
	console.log("\n");
    }
}

// combine all words of transcript into an array
function combine(trans) {
    var res = []
    for (t of trans) {
	if (t.alternatives[0].words !== undefined) {
	    res = res.concat(t.alternatives[0].words);
	}
    }
    return res;
}

// Given a subtitle line, create a sub object that contains the line and start and end time
function makeSubLib(text, words) {
    var sub = {text: "", start: "", end : ""};
    sub.text = text;
    sub.start = words[0].startTime;
    
    var sentence = "";
    var i = 0;

    var error = true; // assuming failure
    for (w of words) {
	i++;
	sentence = sentence + " " + w.word;
	if (text.trim().localeCompare(sentence.trim()) == 0) {
	    sub.end = w.endTime;
	    error = false;
	    break;
	}
    }

    if (error) {
	throw new Error('failed to match subtitle sentence: ' + text);
    }
    
    // remove it in the words. This is in place removal
    words.splice(0, i);
    return sub;
}

function transform(sentence, pred, split, suffix) {
    var res = [];
    const sleng = sentence.split(' ').length;
    if (pred(sentence)) {
	var arr = sentence.split(split);
	for (i=0; i<arr.length; i++) {
	    let comma = suffix;
	    if (i === arr.length-1) {
		comma = '';
	    }
	    if (arr[i].length > 0) {
		res.push(transform(arr[i], pred, split, suffix) + comma);
	    }
	}
    } else {
	res.push(sentence);
    }
    return res;
}

function commaBreak(sentence) {
    const max = 5;
    const min = 2;
    const split = ',';
    const suffix = ',';

    const pred = (sen) =>
	  sen.split(' ').length >= max &&
	  sen.includes(',') &&
	  isNaN(sen.split(',')[0]) &&
	  sen.split(',').every(x => x.split(' ').length > min);
    
    return transform(sentence, pred, split, suffix);
}

function andBreak(sentence) {
    const max = 5;
    const min = 2;
    const split = ' and ';
    const suffix = ' and';
    
    const pred = (sen) =>
	  sen.split(' ').length >= max &&
	  sen.includes(' and ') &&
	  sen.split(' and ').every(x => x.split(' ').length > min);
    
    return transform(sentence, pred, split, suffix);
}

function orBreak(sentence) {
    const max = 5;
    const min = 3;
    const split = ' or ';
    const suffix = ' or';
    
    const pred = (sen) =>
	  sen.split(' ').length >= max &&
	  sen.includes(' or ') &&
	  sen.split(' or ').every(x => x.split(' ').length > min);
    
    return transform(sentence, pred, split, suffix);
}

function autoBreak(s) {
    var res = [];
    commaBreak(s).forEach(
	x => andBreak(x).forEach(
	    y => res = res.concat(orBreak(y))
	)
    )
    return res;
}
