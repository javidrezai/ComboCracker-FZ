# میان‌برهای مغز ستایش
VAULT ?= $(CURDIR)/vault
export SETAYESH_VAULT=$(VAULT)

.PHONY: help run serve dashboard test files transparency docker

help:            ## نمایش این راهنما
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n",$$1,$$2}'

run:             ## اجرای تعاملی مغز
	@bash run.sh

serve:           ## وبهوک HTTP + داشبورد وب روی :8787
	@bash run.sh --serve

dashboard:       ## ساخت/به‌روزرسانی داشبورد
	@python3 brain/server/main.py --dashboard

files:           ## لیست فایل‌های والت
	@python3 brain/server/main.py --files

transparency:    ## نمایش استدلال آخرین اجرا
	@python3 brain/server/main.py --transparency

test:            ## اجرای تست‌ها
	@cd brain/server && python3 -m unittest tests.test_brain -v

docker:          ## اجرا با Docker (Ollama + مغز)
	@cd brain && docker compose up -d
