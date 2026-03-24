@echo off
title Internetga Chiqarish Tunneli (Ngrok o'rniga)
color 0B
echo ===================================================
echo     Serveringizni bepul internetga ulash boshlandi...
echo     "your url is: https://..." degan yozuv chiqishini kuting!
echo     Shu ssilka sizning haqiqiy ishlaydigan serveringiz.
echo ===================================================
cd local-video-api
npx localtunnel --port 3000
pause
