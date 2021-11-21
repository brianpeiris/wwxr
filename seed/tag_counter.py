import re
from collections import Counter
from mrcc import CCJob
import logging
import pymongo

client = pymongo.MongoClient('mongodb://db:27017')
db = client.wwxr
pages = db.pages

LOG = logging.getLogger('CCJob')

VIDEO_TAG_PATTERN = re.compile(b'<video[^>]*>')

class TagCounter(CCJob):
    def process_record(self, record):
        if record['Content-Type'] == 'application/http; msgtype=response':
            payload = record.payload.read()
            headers, body = payload.split(b'\r\n\r\n', 1)
            if b'Content-Type: text/html' in headers:
                if VIDEO_TAG_PATTERN.search(body) is not None:
                    url = record.url
                    pages.insert_one({'url': url})
                    self.increment_counter('commoncrawl', 'videos_found', 1)
                    yield None, None
                self.increment_counter('commoncrawl', 'processed_pages', 1)

    def reducer(self, keys, values):
        yield None, None

    def reducer_final(self):
        client.close()


if __name__ == '__main__':
    TagCounter.run()
