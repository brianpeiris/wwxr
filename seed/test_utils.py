import unittest

from utils import parse_tags

class TestUtils(unittest.TestCase):
    def test_title(self):
        self.assertEqual(
            parse_tags(b'''
                <title>foo</title>
            '''),
            {
                'title': 'foo',
                'description': None,
                'models': [],
                'iosModels': [],
                'hasScene': False
            }
        )

    def test_multiline_title(self):
        self.assertEqual(
            parse_tags(b'''
                <title>
                foo
                bar
                </title>
            '''),
            {
                'title': 'foo\n                bar',
                'description': None,
                'models': [],
                'iosModels': [],
                'hasScene': False
            }
        )

    def test_description(self):
        self.assertEqual(
            parse_tags(b'''
                <meta name="description" content="bar" />
            '''),
            {
                'title': None,
                'description': 'bar',
                'models': [],
                'iosModels': [],
                'hasScene': False
            }
        )

    def test_model(self):
        self.assertEqual(
            parse_tags(b'''
                <model-viewer src="baz">
            '''),
            {
                'title': None,
                'description': None,
                'models': ['baz'],
                'iosModels': [],
                'hasScene': False
            }
        )

    def test_ios_model(self):
        self.assertEqual(
            parse_tags(b'''
                <model-viewer ios-src="baz">
            '''),
            {
                'title': None,
                'description': None,
                'models': [],
                'iosModels': ['baz'],
                'hasScene': False
            }
        )

    def test_models(self):
        self.assertEqual(
            parse_tags(b'''
                <model-viewer src="foo">
                <model-viewer ios-src="bar">
                <model-viewer src="baz">
            '''),
            {
                'title': None,
                'description': None,
                'models': ['foo', 'baz'],
                'iosModels': ['bar'],
                'hasScene': False
            }
        )

    def test_scene(self):
        self.assertEqual(
            parse_tags(b'''
                <a-scene foo="bar">
            '''),
            {
                'title': None,
                'description': None,
                'models': [],
                'iosModels': [],
                'hasScene': True
            }
        )

    def test_full(self):
        self.assertEqual(
            parse_tags(b'''
                <title>foo</title>
                <meta name="description" content="bar" />
                <model-viewer src="baz" ios-src="test">
                <a-scene>
            '''),
            {
                'title': 'foo',
                'description': 'bar',
                'models': ['baz'],
                'iosModels': ['test'],
                'hasScene': True
            }
        )

if __name__ == '__main__':
    unittest.main()
