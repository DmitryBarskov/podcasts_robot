SHELL := /bin/bash

set_webhook:
	source .env && npx ts-node bin/set_webhook.ts

setup:
	npm install
	cp .env.example .env

build: setup
	cd lambda/bot-entrypoint && npm install
	cd lambda/telegram-api && npm install
	cd lambda/video-downloader && npm install

deploy:
	source .env && aws-vault exec podcasts -- npx cdk deploy

destroy:
	source .env && aws-vault exec podcasts -- npx cdk destroy
