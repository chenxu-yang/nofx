# 交易记录查询快速开始指南

## 功能概述

现在您可以方便地查询指定时间范围内的交易记录，并自动过滤掉那些没有实际交易动作的日志记录。

### 核心功能

✅ **时间范围查询**：查询最近 N 天的记录（例如：最近一周、一个月）  
✅ **智能过滤**：只显示包含开单/平单动作的记录，忽略观望周期  
✅ **按时间排序**：最新的交易记录排在最前面  
✅ **详细信息**：包含每次交易的完整上下文（账户状态、持仓、决策等）

## 快速使用

### 方法一：使用命令行脚本（推荐）

```bash
# 1. 设置您的 JWT Token
export JWT_TOKEN='your_jwt_token_here'

# 2. 查询最近一周的交易记录（默认）
./scripts/query_trade_records.sh

# 3. 查询最近30天的交易记录
./scripts/query_trade_records.sh 30

# 4. 查询最近一周的所有记录（包括观望周期）
./scripts/query_trade_records.sh 7 false

# 5. 查询所有历史交易记录
./scripts/query_trade_records.sh 0
```

### 方法二：直接调用 API

```bash
# 查询最近一周有交易动作的记录
curl -X GET "http://localhost:8080/api/trade-records?days=7&only_trades=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API 参数说明

| 参数          | 类型   | 默认值               | 说明                             |
| ------------- | ------ | -------------------- | -------------------------------- |
| `trader_id`   | string | 当前用户第一个交易员 | 交易员 ID                        |
| `days`        | int    | 7                    | 查询最近几天的记录（0=所有记录） |
| `only_trades` | bool   | true                 | 是否只返回有交易动作的记录       |

## 使用场景

### 1. 查看本周交易总结

```bash
# 查看最近7天的所有开单/平单操作
./scripts/query_trade_records.sh 7
```

**输出示例：**

```
=== 交易记录查询工具 ===

查询成功!

统计信息:
  查询天数: 7 天
  只显示交易: true
  记录总数: 15 条

交易记录列表:
================================================================

时间: 2024-01-10 15:30:00
周期: #125
账户净值: $10500
持仓数: 2
交易动作:
  - OPEN_LONG BTCUSDT @ $45000 (数量: 0.1)
执行结果: ✓ 成功
----------------------------------------------------------------
...

交易动作统计:
  开多仓: 8 次
  开空仓: 3 次
  平多仓: 6 次
  平空仓: 2 次
```

### 2. 查看某个币种的交易历史

```bash
# 先获取所有交易记录，然后用 jq 过滤
export JWT_TOKEN='your_token'
./scripts/query_trade_records.sh 30 | grep -A 5 "BTCUSDT"
```

### 3. 分析交易频率

```bash
# 查看最近一周每天的交易次数
./scripts/query_trade_records.sh 7 | grep "时间:" | cut -d' ' -f2 | cut -d'T' -f1 | uniq -c
```

## 响应数据结构

```json
{
  "days": 7,
  "only_trades": true,
  "total_count": 15,
  "records": [
    {
      "timestamp": "2024-01-10T15:30:00Z",
      "cycle_number": 125,
      "account_state": {
        "total_balance": 10500.5,
        "available_balance": 8200.3,
        "total_unrealized_profit": 500.5,
        "position_count": 2,
        "margin_used_pct": 22.5
      },
      "decisions": [
        {
          "action": "open_long",
          "symbol": "BTCUSDT",
          "quantity": 0.1,
          "leverage": 5,
          "price": 45000.0,
          "order_id": 12345678,
          "timestamp": "2024-01-10T15:30:05Z",
          "success": true
        }
      ],
      "execution_log": ["✓ BTCUSDT open_long 成功"],
      "success": true
    }
  ]
}
```

## 常见问题

### Q1: 为什么记录数量比预期少？

A: 默认情况下 `only_trades=true`，只会返回包含实际交易动作（开单/平单）的记录。如果您想查看所有决策周期，请设置 `only_trades=false`。

### Q2: 如何查看更详细的交易信息？

A: API 返回的每条记录都包含完整的上下文信息：

- `system_prompt`: AI 收到的系统提示词
- `cot_trace`: AI 的思维链分析
- `decision_json`: 完整的决策 JSON
- `positions`: 当时的持仓快照
- `candidate_coins`: 候选币种列表

您可以保存完整的 JSON 响应进行详细分析。

### Q3: 时间范围是如何计算的？

A: 基于日志文件的修改时间。`days=7` 表示查询最近 7 天创建或修改的日志文件。

### Q4: 如何获取 JWT Token？

A: 通过登录 API 获取：

```bash
curl -X POST "http://localhost:8080/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "your_email", "password": "your_password"}'
```

响应中的 `token` 字段即为您的 JWT Token。

## 高级用法

### 组合使用 jq 进行数据分析

```bash
# 统计各币种的交易次数
curl -s -X GET "http://localhost:8080/api/trade-records?days=30" \
  -H "Authorization: Bearer $JWT_TOKEN" | \
  jq -r '.records[].decisions[].symbol' | sort | uniq -c | sort -nr

# 计算平均每天的交易次数
curl -s -X GET "http://localhost:8080/api/trade-records?days=7" \
  -H "Authorization: Bearer $JWT_TOKEN" | \
  jq '.total_count / .days'

# 查找所有失败的交易
curl -s -X GET "http://localhost:8080/api/trade-records?days=30" \
  -H "Authorization: Bearer $JWT_TOKEN" | \
  jq '.records[] | select(.success == false)'
```

## 下一步

- 查看完整的 [API 文档](./TRADE_RECORDS_API.md)
- 了解如何在前端界面中集成这个功能
- 探索其他决策日志分析功能

## 反馈与支持

如有问题或建议，请联系开发团队。
