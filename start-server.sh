#!/bin/bash
# BlogAuto 서버 시작 스크립트

cd /home/wonhee-lee/naver-blog-platform

# 이미 실행 중인 서버 종료
pkill -f "next dev" 2>/dev/null
sleep 1

# 서버 시작
echo "========================================="
echo "  BlogAuto 서버를 시작합니다..."
echo "  http://localhost:3000"
echo "========================================="
echo ""

npm run dev
