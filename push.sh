#! /bin/bash

echo "我要push代码"
read commitMsg

now="${commitMsg}" || `date`

git add .
git commit -m "push ${now}"
git push
