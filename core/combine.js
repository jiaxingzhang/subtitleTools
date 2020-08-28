try {
    var myArgs = process.argv.slice(2);
    if (myArgs.length !== 1) {
	console.error('Usage: node combine.js [raw subtitle json] ');
    }
    
    fs = require('fs');    
    var data = fs.readFileSync(myArgs[0], 'utf8')
    var raw = JSON.parse(data);
    var trans = raw.response.annotationResults[0].speechTranscriptions;

    // this is all the words from the video    
    var wordlib = combine(trans);
    console.log(JSON.stringify(wordlib));
    
} catch (err) {
    console.error(err)
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
