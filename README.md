# SubtitleTools

This is small tool written in Node JS to extract subtitle timeline information in MP4 video and generate an SRT file populated with timining and subtitle information leverage Google Cloud ML APIs.

## Usage

### Upload a MP4 file to Google Cloud Platform

You need to make sure the video is accessible, either by specific permission or public if there's no safety concern. You should be able to get a `uri` of the video, such as `gs://xyz/Q1_1.mp4`

### One shot command

```bash
bash subgen.bash -i "gs://xyz/Q1_1.mp4" q1_1
```

Or, if you have the response path, then you can just do:
```bash
bash subgen.bash -p projects/637000999429/locations/us-east1/operations/643114718460463482933 q1_1
```

This will generate the following in the current folder:

```bash
q1_1_raw.json      # raw subtitle
q1_1_control.json  # subtitle control
q1_1.srt           # subtitle file
```

### Generate the subtitle

#### Prepare the control file

`q1_1_control.json` is your subtitle control file and each line in that file is a subtitle line. If you don't like the length of some of the line, just change it in the file and make sure it's valid json syntax.

**IMPORTANT**, do not modify words or punctuation in the `q1_1_control.json` file, because this must **exactly match** the raw subtitle file (`q1_1_raw.json`).

Since manually edit the control file could be tedious as you must break one line into multiple, a text editor with macros will make it easier. For instance, you can put the following into your .emacs file, and then do `Ctrl-c o` in Emacs to insert double quote, comma, newline and double quote for you, which is effectively breaking one line into multiple while maintaining the array json format.

```emacs
(fset 'commai
   [?\" ?, ?\C-f return ?\"])
(global-set-key (kbd "C-c o") 'commai)
```

#### Generate the subtitle SRT file

Once you are happy with the length of subtitle in `q1_1_control.json`, then you can generate subtitle by:

```bash
node parse.js q1_1_raw.json q1_1_control.json
```
