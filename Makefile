SHELL := /bin/bash

.env:
	cp .env.example .env

setup: .env
	npm install

build: setup
	cd lambda/bot-entrypoint && npm install
	cd lambda/telegram-api && npm install
	cd lambda/video-downloader && npm install

deploy:
	source .env && aws-vault exec podcasts -- npx cdk deploy

destroy:
	source .env && aws-vault exec podcasts -- npx cdk destroy
