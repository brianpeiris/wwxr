source /home/env/bin/activate

cat mrcc.py utils.py tag_counter.py | sed "s/from utils import parse_tags//" | sed "s/from mrcc import CCJob//" > tag_counter_emr.py

batch_size=1000
cluster_id="your-cluster-id"
output_bucket="your-output-bucket"

for i in `seq 1 72`
do
	tail -n +$(($i * $batch_size + 1)) input/2021-43.warc.paths | head -n $batch_size > /tmp/seed-paths-$i

	wc -l /tmp/seed-paths-$i

	timestamp=`date +%s`
	echo $i $timestamp


	time python tag_counter_emr.py \
		-r emr \
		--conf-path mrjob.conf \
	        --cluster-id $cluster_id \
	        --no-read-logs \
		--no-output \
		--output-dir s3://$output_bucket/output-$timestamp-$i/ \
		--jobconf mapreduce.jobs.maps=$batch_size \
		--jobconf mapreduce.jobs.reduces=$batch_size \
		/tmp/seed-paths-$i

	echo $i $timestamp
done

