#! /bin/bash

echo "我要push代码"
read commitMsg

msg="${commitMsg}" || `date`

git add .

git commit -m "push ${msg}"

git push
