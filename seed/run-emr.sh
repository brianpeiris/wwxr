source /home/env/bin/activate
cat mrcc.py tag_counter.py | sed "s/from mrcc import CCJob//" > tag_counter_emr.py
python tag_counter_emr.py -r emr --conf-path mrjob.conf --no-output --output-dir s3://bp-wwxr-seed-87453a02/output/ input/2021-43.warc-1.paths
