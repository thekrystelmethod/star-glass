import os
import sys
import unittest
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

import draw_chart


def chart_at(longitude=10.9917):
    return {
        "angles": {
            "Ascendant": {"longitude": 0.0},
            "Midheaven": {"longitude": 90.0},
        },
        "house_cusps": [{"longitude": float(index * 30)} for index in range(12)],
        "placements": {
            "Sun": {"longitude": longitude, "retrograde": False},
        },
        "aspects": [],
    }


class SvgRendererTests(unittest.TestCase):
    def test_captions_are_xml_text_not_markup(self):
        payload = '</text><script>alert(1)</script><text onload="alert(2)">'
        svg = draw_chart.build(chart_at(), title=payload, subtitle="safe & sound")
        root = ET.fromstring(svg)
        self.assertNotIn("<script", svg)
        self.assertFalse(any(element.tag.endswith("script") for element in root.iter()))
        self.assertFalse(any("onload" in element.attrib for element in root.iter()))
        self.assertIn("&lt;/text&gt;&lt;script&gt;", svg)
        self.assertIn("safe &amp; sound", svg)

    def test_palette_and_theme_colors_use_a_narrow_grammar(self):
        malicious = "#fff\" onload=\"alert(1)"
        with self.assertRaises(ValueError):
            draw_chart.build(chart_at(), palette={"ink": malicious})
        with self.assertRaises(ValueError):
            draw_chart.build(chart_at(), themes=[{
                "name": "unsafe",
                "bodies": ["Sun"],
                "color": "url(https://example.test/pixel)",
            }])
        with self.assertRaises(ValueError):
            draw_chart.build(chart_at(), palette={"glyph_font": "serif;src:url(x)"})

    def test_palette_is_request_local_under_concurrency(self):
        def render(color):
            return draw_chart.build(chart_at(), palette={"ink": color})

        with ThreadPoolExecutor(max_workers=2) as pool:
            red, blue = pool.map(render, ["#AA0000", "#0000AA"])
        self.assertIn('stroke="#AA0000"', red)
        self.assertNotIn('stroke="#0000AA"', red)
        self.assertIn('stroke="#0000AA"', blue)
        self.assertNotIn('stroke="#AA0000"', blue)

    def test_degree_rounding_carries_into_the_next_degree(self):
        svg = draw_chart.build(chart_at(10.9917))
        self.assertIn("11°00′", svg)
        self.assertNotIn("10°00′", svg)

        sign_boundary = draw_chart.build(chart_at(29.9999))
        self.assertIn("0°00′", sign_boundary)
        self.assertNotIn("29°00′", sign_boundary)


if __name__ == "__main__":
    unittest.main()
