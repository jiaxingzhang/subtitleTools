#!/bin/bash

usage () {
    PROG=`basename $0`;
    echo ""
    echo " Name:
          $PROG - generate subtitle"
    echo " Usage:
          $PROG -i [uri] [name] 
          $PROG -p [path] [name] 
	   Exampe:
	   	  $PROG -i \"gs://minqa/trimmed/Q1_1.mp4\" q1_1
	   	  $PROG -p projects/637000999429/locations/us-east1/operations/643114718460463428 q1_1"    
    echo ""
}

case "$1" in
    -h|-help|--help)
	usage
	exit 0
	;;
    -i)
	echo "Getting response..."
	URI=$(bash prep.bash -u $2);
	echo $URI
	;;
    -p)
	URI=$2
	;;
    *)
	usage
	exit 0
	;;
esac

RAW=$3_raw.json
CON=$3_control.json
SUB=$3.srt
echo "Generating $RAW..."
bash prep.bash -r $URI > $RAW
echo "Done."
echo "Generating $CON..."
bash prep.bash -c $URI > $CON
echo "Done."
echo "Generating subtitle file: $SUB..."
node core/parse.js $RAW $CON > $SUB
cat $SUB
echo "Done."
