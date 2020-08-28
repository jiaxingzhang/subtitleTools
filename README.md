# SubtitleTools

This is small tool written in Node JS to extract subtitle timeline information in MP4 video and generate an SRT file populated with timining and subtitle information leverage Google Cloud ML APIs.

## Usage

### Upload a MP4 file to Google Cloud Platform

You need to make sure the video is accessible, either by specific permission or public if there's no safety concern. You should be able to get a `uri` of the video, such as `gs://xyz/Ken_Ham.mp4`

### Request the annotation from Google Cloud

`bash prep.bash -u "gs://xyz/Ken_Ham.mp4"`

This returns something like

`projects/90239023/locations/us-east1/operations/834335290978924923283`

Now, depending on how long your video is, you might need to wait for a few minutes. 

Once the video is ready, you can get the raw subtitle:

`bash prep.bash -r projects/90239023/locations/us-east1/operations/834335290978924923283 > mysub_raw.json`

and the subtitle control file:

`bash prep.bash -c projects/90239023/locations/us-east1/operations/834335290978924923283 > mysub_control.json`

### Generate the subtitle

#### Prepare the control file
`mysub_control.json` is your subtitle control file and each line in that file is a subtitle line. so if you don't like the length of some of the line, just change it in the file.

**IMPORTANT**, do not modify words or punctuation in the `mysub_control.json` file, because this must be exactly match the raw subtitle file (`mysub_raw.json`).

Since manually edit the control file could be tedious work as you must break one line into multiple, a text editor with macros will make it a lot easier. For instance, you can put the following into your .emacs file, and then do `Ctrl-c o` in Emacs to insert double quote, comma and newline for you. 

```
(fset 'commai
   [?\" ?, ?\C-f return ?\"])
(global-set-key (kbd "C-c o") 'commai)
```

#### Generate the subtitle SRT file

Once you are happy with the length of subtitle in `mysub_control.json`, then you can generate subtitle by:

`node parse.js mysub_raw.json mysub_control.json`
