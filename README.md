# Report mixed content on web pages using PhantomJS

This is a simple script which loads HTTPS pages and reports any resources which are loaded insecurely and are thus likely to be blocked by modern browsers.

## Requirements

* Docker

## Usage

- Run the container with the options you want

```bash
docker run --rm -it asvinours/mixed-content-scanner scan https://www.example.com/ https://www.example2.com/ ...
```

## Options

- --mobile, --tablet, --pc

Use this option to force a user-agent when parsing the website

- --useragent

Use this option if you need to specify a specific user agent

```bash
docker run --rm -it asvinours/mixed-content-scanner scan --useragent "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A366 Safari/600.1.4" https://www.example.com/embed/
```

- --verbose

If you need to maximise the output

- --crawl

If you want to parse an entire site instead of just a few pages.
If you use this option please only run this script on your own site.

- --disable-cookies

If you want to disable cookies when running the crawler

## Example output

```bash
$ docker run --rm -it asvinours/mixed-content-scanner scan --useragent --disable-cookies "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A366 Safari/600.1.4" https://www.youporn.com/embed/

❕  https://www.youporn.com/embed/ displayed insecure content from http://cdn4f.image.youporn.phncdn.com/m=eKw7Kgaaaa/m=eKw7Ke/201311/26/9042887/original/8/aus-dem-group-vintage-8.jpg.
❕  https://www.youporn.com/embed/ displayed insecure content from http://cdn5f.image.youporn.phncdn.com/m=eKw7Kgaaaa/m=eKw7Ke/201609/09/13040717/original/8/blondie-vibes-her-hot-pussy-8.jpg.
❕  https://www.youporn.com/embed/ displayed insecure content from http://cdn4f.image.youporn.phncdn.com/m=eKw7Kgaaaa/m=eKw7Ke/201512/11/12322857/original/8/beautiful-webcam-girl-8.jpg.
❕  https://www.youporn.com/embed/ displayed insecure content from http://cdn5f.image.youporn.phncdn.com/m=eKw7Kgaaaa/m=eKw7Ke/201507/27/11700671/original/8/she-loves-my-cum-8.jpg.
❕  https://www.youporn.com/embed/ displayed insecure content from http://cdn5f.image.youporn.phncdn.com/m=eKw7Kgaaaa/m=eKw7Ke/201602/29/12524405/original/8/cutie-likes-to-be-choked-during-sex-8.jpg.
❕  https://www.youporn.com/embed/ displayed insecure content from http://cdn5f.image.youporn.phncdn.com/m=eKw7Kgaaaa/m=eKw7Ke/201510/03/12057071/original/8/hot-nipples-8.jpg.
✅  https://www.youporn.com/embed/
```

```bash
$ docker run --rm -it asvinours/mixed-content-scanner scan --crawl --verbose https://www.baumannfabrice.com/

Opening https://www.baumannfabrice.com/ (0 remaining)
	💻DOMContentLoaded 0.017s
	💻load 0.050s
✅  https://baumannfabrice.com/
Opening https://www.baumannfabrice.com/project (1 remaining)
	💻DOMContentLoaded 0.006s
	💻load 0.014s
✅  https://baumannfabrice.com/project/
Opening https://www.baumannfabrice.com/vitae (6 remaining)
	💻DOMContentLoaded 0.007s
	💻load 0.022s
✅  https://baumannfabrice.com/vitae/
Opening https://www.baumannfabrice.com/project/patrouille_de_france_et_equipe_de_voltige_de_l_armee_de_l_air (5 remaining)
	💻DOMContentLoaded 0.006s
	💻load 0.040s
```
