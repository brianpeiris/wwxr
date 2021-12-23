source /home/env/bin/activate

cat mrcc.py utils.py tag_counter.py | sed "s/from utils import parse_tags//" | sed "s/from mrcc import CCJob//" > tag_counter_emr.py

batch_size=100

for i in `seq 0 1`
do
	tail -n +$(($i * batch_size + 1)) input/2021-43.warc.paths | head -n $batch_size > /tmp/seed-paths
	TIMESTAMP=`date +%s`
	echo $i $TIMESTAMP
	time python tag_counter_emr.py -r emr --conf-path mrjob.conf --no-output --output-dir s3://bp-wwxr-seed-87453a02/output-$TIMESTAMP/ /tmp/seed-paths
	echo $i $TIMESTAMP
done

