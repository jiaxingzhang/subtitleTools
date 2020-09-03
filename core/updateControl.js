try {
    var myArgs = process.argv.slice(2);
    if (myArgs.length !== 2) {
	console.error('Usage: node updateControl.js [raw subtitle json] [subtitle control json] ');
    }
    
    fs = require('fs');    
    var data = fs.readFileSync(myArgs[0], 'utf8')
    var wordlib = JSON.parse(data);

    // sub file is what the actual subtitle lines you'd like to have
    // This is where you can control the length of each subtitle line
    var subfile = fs.readFileSync(myArgs[1], 'utf8');
    var subf = JSON.parse(subfile).trans;

    var subs = [];
    for (su of subf) {
	var sub = makeSubLib(su, wordlib);
	var shortSub = adjustLength(sub);
	for (ss of shortSub) {
	    let shorterSub = autoBreak(ss);
	    for (ss2 of shorterSub) {
		subs.push(ss2);
	    }
	}
    }

    // subs is an array of sub object {start, end, text}
    genControl(subs);
    
} catch (err) {
    console.error(err)
}

function genControl(subs) {
    var control = {trans: []};
    for (s of subs) {
	control.trans.push(s.text);
    }
    console.log(JSON.stringify(control, null, 2))
}


// Given a subtitle line, create a sub object that contains the line and start and end time
function makeSubLib(text, words) {
    var sub = {text: '', start: '', end: '', elem: []};
    sub.text = text;
    sub.start = words[0].startTime;
    
    var sentence = '';
    var error = true; // assuming failure
    while(words.length > 0) {
	let w = words.shift();
	sentence += ' ' + w.word;
	sub.elem.push(w);
	if (text.trim().localeCompare(sentence.trim()) == 0) {
	    sub.end = w.endTime;
	    error = false;
	    break;
	}
    }

    if (error) {
	throw new Error('failed to match subtitle sentence: ' + text);
    }
    
    return sub;
}

function splitSub(sub, split) {
    if (sub.elem.length === 0) {
	throw new Error('splitSub cannot work on empty sub ');
    }
    
    let startNew = true;
    let res = [];
    for (i=0; i< sub.elem.length; i++) {
	let e = sub.elem[i];
	if (startNew) {
	    startNew = false;
	    prev = e;
	    // we don't care if the 1st element is the split
	    continue; 
	}
	
	let test = ' ' + e.word + ' ';
	if (test.includes(split)) {
	    res.push(make_sub(sub.elem, prev, e));
	    startNew = true;
	}
    }
    if (!startNew) {
	res.push(make_sub(sub.elem, prev, sub.elem[sub.elem.length - 1]));
    }
    return res;
}

function transform(sub, pred, split) {
    var res = [];
    var sentence = sub.text;
    if (pred(sentence)) {
	var arr = splitSub(sub, split);
	if (arr.length.length <= 0) {
	    throw new Error('encountered empty array during transform');
	}
	for (i=0; i<arr.length; i++) {
	    if (arr[i].length <= 0) {
		throw new Error('encountered empty sub during transform');
	    }
	    res = res.concat(transform(arr[i], pred, split));
	}
    } else {
	res.push(sub);
    }
    return res;
}

function commaBreak(sub) {
    const max = 5;
    const min = 2;
    const split = ',';
    const pred = (sen) =>
	  sen.split(' ').length >= max &&
	  sen.includes(',') &&
	  isNaN(sen.split(',')[0]) &&
	  sen.split(',').every(x => x.split(' ').length > min);
    
    return transform(sub, pred, split);
}

function wordBreak(sub, word) {
    const max = 5;
    const min = 2;
    const split = ' ' + word + ' ';
    const pred = (sen) =>
	  sen.split(' ').length >= max &&
	  sen.includes(split) &&
	  sen.split(split).every(x => x.split(' ').length > min);
    
    return transform(sub, pred, split);
}

function andBreak(sub) {
    return wordBreak(sub, 'and');
}

function orBreak(sub) {
    return wordBreak(sub, 'or');
}

function butBreak(sub) {
    return wordBreak(sub, 'but');
}

function breakCore(xforms, i, s) {
    if (xforms.length-1 == i) {
	return xforms[i](s);
    }
    let res = [];
    for (t of xforms[i](s)) {
	res = res.concat(breakCore(xforms, i+1, t))
    }
    return res;
}

function autoBreak(s) {
    var xforms = [commaBreak, andBreak, orBreak, butBreak];
    return breakCore(xforms, 0, s);
}

function make_sub(elems, begin, end) {
    var sub = {text: '', start: '', end: '', elem: []};
    sub.start = begin.startTime
    sub.end = end.endTime

    let on = false;
    for (e of elems) {
	if (e === begin) {
	    on = true;
	}
	
	if (on) {
	    sub.text += ' ' + e.word
	    sub.elem.push(e);
	}
	    
	if (e === end) {
	    on = false;
	}	
    }
    return sub;
}

function adjustLength(sub) {
    const max = 20;
    const split_th = 0;
    
    if (sub.text.split(' ').length <= max ||
	sub.elem.length <= 2) {
	return [sub];
    }

    let gap = {last: '', cur: ''}
    gap.last = sub.elem[0];
    gap.cur = sub.elem[0];

    let prev = sub.elem[0];
    let max_diff = 0;
    
    for (i=1; i<sub.elem.length; i++) {
	// update the gap to the largest
	let diff = Number(sub.elem[i].startTime.replace(/s$/, "")) - Number(prev.endTime.replace(/s$/, ""))
	if (diff > max_diff) {
	    gap.last = prev;
	    gap.cur = sub.elem[i]
	    max_diff = diff
	}
	prev = sub.elem[i]
    }
    var res = []
    if (max_diff > split_th) {
	let p1 = make_sub(sub.elem, sub.elem[0], gap.last)
	let p2 = make_sub(sub.elem, gap.cur, sub.elem[sub.elem.length - 1])
	res = res.concat(adjustLength(p1)).concat(adjustLength(p2))
	return res;
    }
    return [sub];
}
