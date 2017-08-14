#! /bin/bash

echo "我要push代码吗（Y/N）"

now=`date`

read isPush

if [ "${isPush}" == "Y" ]; then
  git add .
  git commit -m "push ${now}"
  git push
fi