#!/usr/bin/env bash
git reset --hard HEAD
git clean -f
git pull
sh ./deploy.sh
