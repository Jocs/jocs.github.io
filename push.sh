#! /bin/bash

echo "我要push代码"

now=`date`

git add .
git commit -m "push ${now}"
git push
