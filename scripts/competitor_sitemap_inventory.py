#!/usr/bin/env python3
"""Inventory public sitemap URLs without counting image references as pages.

Example:
  python scripts/competitor_sitemap_inventory.py \
    https://lancamentosrj.com/sitemap.xml /tmp/lancamentosrj-urls.csv
"""

import argparse
import csv
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter

NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
USER_AGENT = "Mozilla/5.0 (compatible; AlphaEditorialAudit/1.0)"


def fetch_xml(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return ET.fromstring(response.read())


def inventory(index_url):
    host = urllib.parse.urlsplit(index_url).netloc
    pending = [index_url]
    visited = set()
    rows = []
    while pending:
        sitemap = pending.pop(0)
        parsed = urllib.parse.urlsplit(sitemap)
        if parsed.scheme != "https" or parsed.netloc != host:
            raise ValueError(f"Sitemap fora do domínio inicial: {sitemap}")
        if sitemap in visited:
            continue
        if len(visited) >= 100:
            raise ValueError("Limite de 100 sitemaps atingido")
        visited.add(sitemap)
        root = fetch_xml(sitemap)
        kind = root.tag.rsplit("}", 1)[-1]
        if kind == "sitemapindex":
            pending.extend(node.text for node in root.findall("s:sitemap/s:loc", NS))
            continue
        if kind != "urlset":
            raise ValueError(f"XML inesperado em {sitemap}: {kind}")
        for node in root.findall("s:url", NS):
            loc = node.findtext("s:loc", namespaces=NS)
            if not loc:
                continue
            path = urllib.parse.urlsplit(loc).path.strip("/")
            segments = path.split("/") if path else []
            rows.append({
                "sitemap": sitemap,
                "url": loc,
                "path_type": segments[0] if segments else "home",
                "path_depth": len(segments),
                "lastmod": node.findtext("s:lastmod", default="", namespaces=NS),
            })
    return rows, visited


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sitemap", help="URL HTTPS do índice público de sitemap")
    parser.add_argument("output", help="Arquivo CSV de saída")
    args = parser.parse_args()
    if urllib.parse.urlsplit(args.sitemap).scheme != "https":
        parser.error("Use uma URL HTTPS")
    rows, visited = inventory(args.sitemap)
    with open(args.output, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["sitemap", "url", "path_type", "path_depth", "lastmod"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Sitemaps: {len(visited)} | entradas: {len(rows)} | URLs únicas: {len({r['url'] for r in rows})}")
    for kind, count in Counter(row["path_type"] for row in rows).most_common():
        print(f"{kind}: {count}")
    print("Sitemap é descoberta, não prova de indexação, atualidade, tráfego ou leads.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ET.ParseError, ValueError) as error:
        print(f"Erro: {error}", file=sys.stderr)
        sys.exit(1)
