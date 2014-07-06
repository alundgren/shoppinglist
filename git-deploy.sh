#!/usr/bin/env bash
git reset --hard HEAD
git clean -f
git pull
chmod 100 git-deploy.sh
sh ./deploy.sh
