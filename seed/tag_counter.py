import re
from collections import Counter
from mrcc import CCJob
import logging

from utils import parse_tags

LOG = logging.getLogger('CCJob')


class TagCounter(CCJob):
    def process_record(self, record):
        if record['Content-Type'] == 'application/http; msgtype=response':
            payload = record.payload.read()
            headers, body = payload.split(b'\r\n\r\n', 1)

            if b'Content-Type: text/html' in headers:
                url = record.url
                results = parse_tags(body)
                if results['hasScene'] or len(results['models']) or len(results['iosModels']):
                    self.increment_counter('commoncrawl', 'content_found', 1)
                    yield url, results

                self.increment_counter('commoncrawl', 'processed_pages', 1)

    def reducer(self, key, values):
        yield key, list(values)[0]

if __name__ == '__main__':
    TagCounter.run()
