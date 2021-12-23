import re
import logging

LOG = logging.getLogger('CCJob')

TITLE_TAG_PATTERN = re.compile(b'<title>([^<]+)</title>')
DESC_TAG_PATTERN = re.compile(b'<meta[^>]+name="description"[^>]+content="([^"]+)"')
MODEL_TAG_PATTERN = re.compile(b'<model-viewer[^>]*[^-]src="([^"]+)"[^>]*>')
MODEL_IOS_TAG_PATTERN = re.compile(b'<model-viewer[^>]+ios-src="([^"]+)"[^>]*>')
SCENE_TAG_PATTERN = re.compile(b'<a-scene[^>]*>')

def parse_tags(html):
    title_match = TITLE_TAG_PATTERN.search(html)
    desc_match = DESC_TAG_PATTERN.search(html)
    model_match = MODEL_TAG_PATTERN.findall(html)
    model_ios_match = MODEL_IOS_TAG_PATTERN.findall(html)
    scene_match = SCENE_TAG_PATTERN.search(html)

    title = None
    try:
        title = title_match and str(title_match.group(1), 'utf8').strip()
    except UnicodeDecodeError:
        pass

    description = None
    try:
        description = desc_match and str(desc_match.group(1), 'utf8')
    except UnicodeDecodeError:
        pass

    return {
        'title': title,
        'description': description,
        'models': list(set(map(lambda m : str(m, 'utf8'), model_match))),
        'iosModels': list(set(map(lambda m : str(m, 'utf8'), model_ios_match))),
        'hasScene': scene_match is not None
    }
