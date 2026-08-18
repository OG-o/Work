.PHONY: all install start stop restart status url logs test clean help

all: status

help:
	@echo "========================================================"
	@echo "       🚀 Ubuntu 24.04 Cloud PC Makefile Commands       "
	@echo "========================================================"
	@echo "  make install  - Run 1-click installer and setup stack"
	@echo "  make start    - Start all desktop, audio & tunnel services"
	@echo "  make stop     - Stop all running services"
	@echo "  make restart  - Restart all services"
	@echo "  make status   - Show service status and active web URL"
	@echo "  make url      - Print the public live web access link"
	@echo "  make logs     - Display real-time system and tunnel logs"
	@echo "  make test     - Run automated system diagnostic health test"
	@echo "  make clean    - Clean temporary log files and caches"
	@echo "========================================================"

install:
	bash ./setup.sh

start:
	./bin/cloudpc start

stop:
	./bin/cloudpc stop

restart:
	./bin/cloudpc restart

status:
	./bin/cloudpc status

url:
	./bin/cloudpc url

logs:
	./bin/cloudpc logs

test:
	python3 ./scripts/system_health_check.py

clean:
	rm -f /tmp/*.log /tmp/*.deb
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
