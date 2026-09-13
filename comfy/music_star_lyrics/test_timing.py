import unittest
from timing import make_phrases, stamp


def raw(words):
    return {'segments': [{'words': [{'word': text, 'start': start, 'end': end, 'probability': 0.95}
                                   for text, start, end in words]}]}


class TimingTests(unittest.TestCase):
    def test_intro_and_repeated_phrases(self):
        phrases, warnings = make_phrases(raw([('Clap', 8.125, 8.6), ('again!', 8.6, 9.5),
                                             ('Clap', 12, 12.5), ('again!', 12.5, 13.8)]), 20)
        self.assertEqual([p['text'] for p in phrases], ['Clap again!', 'Clap again!'])
        self.assertEqual(phrases[0]['start'], 8.125)
        self.assertEqual(phrases[-1]['end'], 13.8)
        self.assertEqual(warnings, [])

    def test_word_limit_and_gap(self):
        phrases, _ = make_phrases(raw([('a', 1, 1.2), ('b', 1.2, 1.4), ('c', 1.4, 1.6), ('d', 3, 3.4)]), 10, max_words=2)
        self.assertEqual([p['text'] for p in phrases], ['a b', 'c', 'd'])

    def test_invalid_times_not_interpolated(self):
        phrases, warnings = make_phrases(raw([('hello', 1, 2), ('bad', 1.5, 2.5), ('outside', 12, 13)]), 10)
        self.assertEqual([p['text'] for p in phrases], ['hello'])
        self.assertEqual(len(warnings), 2)
        self.assertEqual(stamp(59.9996), '01:00.000')

    def test_low_confidence_needs_review(self):
        data = raw([('happy!', 1, 2)])
        data['segments'][0]['words'][0]['probability'] = 0.3
        self.assertTrue(make_phrases(data, 10)[0][0]['needsReview'])


if __name__ == '__main__':
    unittest.main()
