SHELL := /bin/bash

build:
	cd lambda/bot-entrypoint && npm install
	cd lambda/telegram-api && npm install
	cd lambda/video-downloader && npm install

deploy: build
	source .env && aws-vault exec fwd-tweet -- npx cdk deploy --hotswap
