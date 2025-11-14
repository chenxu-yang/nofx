#!/bin/bash

# 交易记录查询脚本
# 用法: ./scripts/query_trade_records.sh [days] [only_trades]

# 默认配置
API_URL="http://localhost:8080"
DAYS=${1:-7}  # 默认查询最近7天
ONLY_TRADES=${2:-true}  # 默认只显示有交易动作的记录

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 交易记录查询工具 ===${NC}"
echo ""
echo -e "${YELLOW}配置信息:${NC}"
echo "  API地址: $API_URL"
echo "  查询天数: $DAYS 天"
echo "  只显示交易记录: $ONLY_TRADES"
echo ""

# 检查是否有JWT token
if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}错误: 请先设置环境变量 JWT_TOKEN${NC}"
    echo "使用方法:"
    echo "  export JWT_TOKEN='your_jwt_token_here'"
    echo "  $0 [days] [only_trades]"
    echo ""
    echo "示例:"
    echo "  export JWT_TOKEN='eyJhbGc...'"
    echo "  $0 7 true     # 查询最近7天有交易动作的记录"
    echo "  $0 30 false   # 查询最近30天所有记录"
    echo "  $0 0 true     # 查询所有历史交易记录"
    exit 1
fi

# 发送请求
echo -e "${YELLOW}正在查询...${NC}"
echo ""

RESPONSE=$(curl -s -X GET \
  "${API_URL}/api/trade-records?days=${DAYS}&only_trades=${ONLY_TRADES}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json")

# 检查响应
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 请求失败${NC}"
    exit 1
fi

# 检查是否有错误
if echo "$RESPONSE" | grep -q '"error"'; then
    echo -e "${RED}错误:${NC}"
    echo "$RESPONSE" | jq -r '.error'
    exit 1
fi

# 格式化输出
echo -e "${GREEN}查询成功!${NC}"
echo ""

# 显示统计信息
TOTAL_COUNT=$(echo "$RESPONSE" | jq -r '.total_count')
echo -e "${YELLOW}统计信息:${NC}"
echo "  查询天数: $(echo "$RESPONSE" | jq -r '.days') 天"
echo "  只显示交易: $(echo "$RESPONSE" | jq -r '.only_trades')"
echo "  记录总数: $TOTAL_COUNT 条"
echo ""

if [ "$TOTAL_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}没有找到符合条件的记录${NC}"
    exit 0
fi

# 显示记录列表
echo -e "${YELLOW}交易记录列表:${NC}"
echo "================================================================"

echo "$RESPONSE" | jq -r '.records[] | 
"
时间: \(.timestamp)
周期: #\(.cycle_number)
账户净值: $\(.account_state.total_balance | tonumber | floor)
持仓数: \(.account_state.position_count)
交易动作:
\(.decisions[] | "  - \(.action | ascii_upcase) \(.symbol) @ $\(.price) (数量: \(.quantity))")
执行结果: \(if .success then "✓ 成功" else "✗ 失败" end)
----------------------------------------------------------------
"'

echo ""
echo -e "${GREEN}查询完成!${NC}"

# 提供额外的统计信息
echo ""
echo -e "${YELLOW}交易动作统计:${NC}"
echo "$RESPONSE" | jq -r '
.records[].decisions[] | 
select(.success == true) | 
.action' | sort | uniq -c | awk '{
    action = $2
    count = $1
    if (action == "open_long") action = "开多仓"
    else if (action == "open_short") action = "开空仓"
    else if (action == "close_long") action = "平多仓"
    else if (action == "close_short") action = "平空仓"
    printf "  %s: %d 次\n", action, count
}'

echo ""

