source /home/env/bin/activate
cat mrcc.py utils.py tag_counter.py | sed "s/from utils import parse_tags//" | sed "s/from mrcc import CCJob//" > tag_counter_emr.py
TIMESTAMP=`date +%s`
time python tag_counter_emr.py -r emr --conf-path mrjob.conf --no-output --output-dir s3://bp-wwxr-seed-87453a02/output-$TIMESTAMP/ input/2021-43.warc-100.paths
