# SubtitleTools

This is small tool written in Node JS to extract subtitle timeline information in MP4 video and generate an SRT file populated with timining and subtitle information leverage Google Cloud ML APIs.

## Quick usage

You need to provide two files:
* Q6.json
* Q6_sub.json

### How to get Q6.json

First,  make sure to set up the credential:
`export GOOGLE_APPLICATION_CREDENTIALS="PATH-TO-CRED.json"`

Before we can get the json file from the server, we need to upload the mp4 to google cloud and make sure it's accessible (e.g. public) and do create a request.json as such:

```
    {
      "inputUri": "URI",  <<- fill this out
      "features": ["TEXT_DETECTION"],
      "videoContext": {
        "textDetectionConfig": {
          "languageHints": ["en-US"] <<- make sure this is correct
        }
      }
    }
	   
```
Then, do the following in bash:
    
`curl -X POST -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) -H "Content-Type: application/json; charset=utf-8" -d @request.json https://videointelligence.googleapis.com/v1/videos:annotate`


Now retrieve it (this will take some time):

`curl -X GET -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) https://videointelligence.googleapis.com/v1/ <from above command>`

Example:

`curl -X GET -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) https://videointelligence.googleapis.com/v1/projects/637000999429/locations/us-east1/operations/10391224840668257911 > Q6.json`


### How to get Q6_sub.json

This file is what the actual subtitle lines you'd like to have and this is where you can control the length of each subtitle line. @todo: can this be generated automatically? Right now, this is half manually:

`cat Q6.json | jq '.response.annotationResults[].speechTranscriptions[].alternatives[].transcript' > Q6_sub.json`

Then, manually construct a json file such as:
```
    {"trans": ["line1", "line2"]}
```

### Run the tool

To run this tool: `node parse.js`
	
