FROM wernight/phantomjs:latest
LABEL maintainer "Fabrice Baumann"

# Usage: docker run --rm -v $(pwd):/opt/mixed-content-scanner/ -it mixed-content-scanner phantomjs scanner.js --useragent "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A366 Safari/600.1.4" https://www.youporn.com/embed/


USER root
WORKDIR /

RUN apt-get update \
      && apt-get install -y --no-install-recommends git

RUN git clone https://github.com/asvinours/phantomjs-mixed-content-scan.git /opt/mixed-content-scanner/ \
	&& ln -s /opt/mixed-content-scanner/report-mixed-content.js /scanner.js

USER phantomjs
