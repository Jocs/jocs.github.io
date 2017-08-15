#! /bin/bash

echo "请输入commit message，不填将会生成当前时间戳。"

read commitMsg

if [ -z "${commitMsg}" ]; then

  msg=`date`

else

  msg="${commitMsg}"

fi

git add .

git commit -m "Message: ${msg}"

git push
