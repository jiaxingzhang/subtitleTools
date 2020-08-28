#!/bin/bash

usage () {
    PROG=`basename $0`;
    echo ""
    echo " Name:
          $PROG - prepare subtitle"
    echo " Usage:
          $PROG [-u] [request.json]    # request video annotation. 
          $PROG [-r] [uri]             # downlaod subtitle raw file.
          $PROG [-c] [uri]             # downlaod subtitle control file."    
    echo ""
}

case "$1" in
    -h|-help|--help)
	usage
	exit 0
	;;
    -u)
	echo "
	{
	  \"inputUri\": \"$2\",
	  \"features\": [\"SPEECH_TRANSCRIPTION\"],
	  \"videoContext\": {
	  \"speechTranscriptionConfig\": {
	  \"languageCode\": \"en-US\",
	  \"enableAutomaticPunctuation\": true,
	  \"filterProfanity\": true
	  }
	 }
	}
	" > .tmp.this.json
	curl -X POST -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) -H "Content-Type: application/json; charset=utf-8" -d @.tmp.this.json https://videointelligence.googleapis.com/v1/videos:annotate | jq -r '.name'
	rm .tmp.this.json
	;;
    -r)
	curl -X GET -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) https://videointelligence.googleapis.com/v1/$2
	;;
    -c)
	echo "
	{\"trans\": [ " > .control.tmp
	curl -X GET -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) https://videointelligence.googleapis.com/v1/$2 | jq '.response.annotationResults[].speechTranscriptions[].alternatives[].transcript' |
	    perl -p -e 's/\. /."\n"/' | perl -p -e 's/\n/,\n/' >> .control.tmp
       echo "    ]
	}" >> .control.tmp
       cat .control.tmp
       rm .control.tmp
esac
