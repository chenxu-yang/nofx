import { useState } from 'react';
import useSWR from 'swr';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../lib/api';
import { 
  ScrollText, 
  Calendar,
  Filter,
  BarChart3,
  Clock,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { DecisionAction, AccountSnapshot } from '../types';

interface TradeRecordsProps {
  traderId?: string;
}

interface TradeRecordItem {
  timestamp: string;
  cycle_number: number;
  account_state: AccountSnapshot;
  positions: any[];
  decisions: DecisionAction[];
  execution_log: string[];
  success: boolean;
  error_message?: string;
}

interface TradeRecordsResponse {
  days: number;
  only_trades: boolean;
  total_count: number;
  records: TradeRecordItem[];
}

export default function TradeRecords({ traderId }: TradeRecordsProps) {
  const { language } = useLanguage();
  const [days, setDays] = useState(7);
  const [onlyTrades, setOnlyTrades] = useState(true);
  const [expandedRecords, setExpandedRecords] = useState<Set<number>>(new Set());

  const { data: tradeRecords, error, isLoading } = useSWR<TradeRecordsResponse>(
    traderId ? `trade-records-${traderId}-${days}-${onlyTrades}` : null,
    traderId ? () => api.getTradeRecords(traderId, days, onlyTrades) : null,
    {
      refreshInterval: 30000, // 30秒刷新
      revalidateOnFocus: false,
      dedupingInterval: 20000,
    }
  );

  const toggleRecord = (cycleNumber: number) => {
    if (!cycleNumber && cycleNumber !== 0) return; // 安全检查
    
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(cycleNumber)) {
      newExpanded.delete(cycleNumber);
    } else {
      newExpanded.add(cycleNumber);
    }
    setExpandedRecords(newExpanded);
  };

  const getActionIcon = (action: string) => {
    if (!action) return <MinusCircle className="w-4 h-4" style={{ color: '#848E9C' }} />;
    
    switch (action) {
      case 'open_long':
        return <ArrowUpCircle className="w-4 h-4" style={{ color: '#0ECB81' }} />;
      case 'open_short':
        return <ArrowDownCircle className="w-4 h-4" style={{ color: '#F6465D' }} />;
      case 'close_long':
        return <MinusCircle className="w-4 h-4" style={{ color: '#0ECB81' }} />;
      case 'close_short':
        return <MinusCircle className="w-4 h-4" style={{ color: '#F6465D' }} />;
      default:
        return <MinusCircle className="w-4 h-4" style={{ color: '#848E9C' }} />;
    }
  };

  const getActionText = (action: string) => {
    if (!action) return language === 'zh' ? '未知' : 'Unknown';
    
    switch (action) {
      case 'open_long':
        return language === 'zh' ? '开多仓' : 'Open Long';
      case 'open_short':
        return language === 'zh' ? '开空仓' : 'Open Short';
      case 'close_long':
        return language === 'zh' ? '平多仓' : 'Close Long';
      case 'close_short':
        return language === 'zh' ? '平空仓' : 'Close Short';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    if (!action) return '#848E9C';
    if (action.includes('long')) return '#0ECB81';
    if (action.includes('short')) return '#F6465D';
    return '#848E9C';
  };

  // 统计交易动作
  const getTradeStats = () => {
    if (!tradeRecords?.records) return null;
    
    const stats = {
      openLong: 0,
      openShort: 0,
      closeLong: 0,
      closeShort: 0,
      total: 0,
    };

    tradeRecords.records.forEach(record => {
      // 添加安全检查
      if (!record.decisions || !Array.isArray(record.decisions)) return;
      
      record.decisions.forEach(decision => {
        if (decision && decision.success) {
          stats.total++;
          switch (decision.action) {
            case 'open_long':
              stats.openLong++;
              break;
            case 'open_short':
              stats.openShort++;
              break;
            case 'close_long':
              stats.closeLong++;
              break;
            case 'close_short':
              stats.closeShort++;
              break;
          }
        }
      });
    });

    return stats;
  };

  const stats = getTradeStats();

  // 如果没有 traderId，显示提示信息
  if (!traderId) {
    return (
      <div className="rounded p-6" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
        <div className="flex items-center gap-2 mb-2">
          <ScrollText className="w-5 h-5" style={{ color: '#FCD535' }} />
          <h2 className="text-lg font-bold" style={{ color: '#EAECEF' }}>
            {language === 'zh' ? '交易记录' : 'Trade Records'}
          </h2>
        </div>
        <div className="text-center py-8" style={{ color: '#848E9C' }}>
          {language === 'zh' ? '请先选择一个交易员' : 'Please select a trader first'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded p-6" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
        <div 
          className="flex items-center gap-3 p-4 rounded"
          style={{
            background: 'rgba(246, 70, 93, 0.1)',
            border: '1px solid rgba(246, 70, 93, 0.2)',
          }}
        >
          <XCircle className="w-6 h-6" style={{ color: '#F6465D' }} />
          <div>
            <div className="font-semibold" style={{ color: '#F6465D' }}>
              {language === 'zh' ? '加载失败' : 'Loading Error'}
            </div>
            <div className="text-sm" style={{ color: '#848E9C' }}>
              {error.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题和控制栏 */}
      <div className="rounded p-6" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5" style={{ color: '#FCD535' }} />
            <h2 className="text-lg font-bold" style={{ color: '#EAECEF' }}>
              {language === 'zh' ? '交易记录' : 'Trade Records'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 时间范围选择 */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: '#848E9C' }} />
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  background: '#2B3139',
                  border: '1px solid #2B3139',
                  color: '#EAECEF',
                }}
              >
                <option value={1}>{language === 'zh' ? '最近 1 天' : 'Last 1 Day'}</option>
                <option value={7}>{language === 'zh' ? '最近 7 天' : 'Last 7 Days'}</option>
                <option value={30}>{language === 'zh' ? '最近 30 天' : 'Last 30 Days'}</option>
                <option value={0}>{language === 'zh' ? '全部' : 'All'}</option>
              </select>
            </div>

            {/* 过滤选项 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: '#848E9C' }} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyTrades}
                  onChange={(e) => setOnlyTrades(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: '#FCD535' }}
                />
                <span className="text-sm" style={{ color: '#EAECEF' }}>
                  {language === 'zh' ? '只显示交易' : 'Trades Only'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            <div className="rounded p-3" style={{ background: '#2B3139' }}>
              <div className="text-xs mb-1" style={{ color: '#848E9C' }}>
                {language === 'zh' ? '总记录' : 'Total'}
              </div>
              <div className="text-xl font-bold" style={{ color: '#EAECEF' }}>
                {tradeRecords?.total_count || 0}
              </div>
            </div>
            <div className="rounded p-3" style={{ background: 'rgba(14, 203, 129, 0.1)' }}>
              <div className="text-xs mb-1" style={{ color: '#0ECB81' }}>
                {language === 'zh' ? '开多' : 'Open Long'}
              </div>
              <div className="text-xl font-bold" style={{ color: '#0ECB81' }}>
                {stats.openLong}
              </div>
            </div>
            <div className="rounded p-3" style={{ background: 'rgba(246, 70, 93, 0.1)' }}>
              <div className="text-xs mb-1" style={{ color: '#F6465D' }}>
                {language === 'zh' ? '开空' : 'Open Short'}
              </div>
              <div className="text-xl font-bold" style={{ color: '#F6465D' }}>
                {stats.openShort}
              </div>
            </div>
            <div className="rounded p-3" style={{ background: 'rgba(14, 203, 129, 0.1)' }}>
              <div className="text-xs mb-1" style={{ color: '#0ECB81' }}>
                {language === 'zh' ? '平多' : 'Close Long'}
              </div>
              <div className="text-xl font-bold" style={{ color: '#0ECB81' }}>
                {stats.closeLong}
              </div>
            </div>
            <div className="rounded p-3" style={{ background: 'rgba(246, 70, 93, 0.1)' }}>
              <div className="text-xs mb-1" style={{ color: '#F6465D' }}>
                {language === 'zh' ? '平空' : 'Close Short'}
              </div>
              <div className="text-xl font-bold" style={{ color: '#F6465D' }}>
                {stats.closeShort}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="rounded p-6 text-center" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
          <div className="flex items-center justify-center gap-2" style={{ color: '#848E9C' }}>
            <BarChart3 className="w-4 h-4 animate-pulse" />
            {language === 'zh' ? '加载中...' : 'Loading...'}
          </div>
        </div>
      )}

      {/* 交易记录列表 */}
      {!isLoading && tradeRecords && (
        <div className="space-y-3">
          {!tradeRecords.records || tradeRecords.records.length === 0 ? (
            <div className="rounded p-8 text-center" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
              <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: '#848E9C' }} />
              <div style={{ color: '#848E9C' }}>
                {language === 'zh' 
                  ? '没有找到符合条件的交易记录' 
                  : 'No trade records found'}
              </div>
            </div>
          ) : (
            tradeRecords.records.map((record, recordIdx) => (
              <div
                key={record.cycle_number || `record-${recordIdx}`}
                className="rounded overflow-hidden"
                style={{ background: '#1E2329', border: '1px solid #2B3139' }}
              >
                {/* 记录头部 */}
                <div
                  className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                  style={{ background: '#2B3139' }}
                  onClick={() => toggleRecord(record.cycle_number)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: '#848E9C' }} />
                        <span className="text-sm font-mono" style={{ color: '#EAECEF' }}>
                          {record.timestamp ? new Date(record.timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US') : '-'}
                        </span>
                      </div>
                      <div className="text-xs px-2 py-1 rounded" style={{ background: '#1E2329', color: '#848E9C' }}>
                        #{record.cycle_number || 0}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" style={{ color: '#848E9C' }} />
                        <span className="text-sm font-semibold" style={{ color: '#EAECEF' }}>
                          ${record.account_state?.total_balance?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="text-xs px-2 py-1 rounded" style={{ 
                        background: record.success ? 'rgba(14, 203, 129, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                        color: record.success ? '#0ECB81' : '#F6465D'
                      }}>
                        {record.success ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>
                      {record.cycle_number && expandedRecords.has(record.cycle_number) ? (
                        <ChevronUp className="w-5 h-5" style={{ color: '#848E9C' }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: '#848E9C' }} />
                      )}
                    </div>
                  </div>

                  {/* 交易动作概览 */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {record.decisions && Array.isArray(record.decisions) && record.decisions.map((decision, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm"
                        style={{
                          background: decision.success ? 'rgba(252, 213, 53, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                          border: `1px solid ${decision.success ? 'rgba(252, 213, 53, 0.2)' : 'rgba(246, 70, 93, 0.2)'}`,
                        }}
                      >
                        {getActionIcon(decision.action)}
                        <span style={{ color: getActionColor(decision.action), fontWeight: 600 }}>
                          {decision.symbol || 'N/A'}
                        </span>
                        <span style={{ color: '#848E9C' }}>·</span>
                        <span style={{ color: '#EAECEF' }}>
                          {getActionText(decision.action)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 展开的详细信息 */}
                {record.cycle_number && expandedRecords.has(record.cycle_number) && (
                  <div className="p-4 space-y-4" style={{ borderTop: '1px solid #2B3139' }}>
                    {/* 账户状态 */}
                    {record.account_state && (
                    <div>
                      <div className="text-sm font-semibold mb-2" style={{ color: '#EAECEF' }}>
                        {language === 'zh' ? '账户状态' : 'Account State'}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded p-3" style={{ background: '#2B3139' }}>
                          <div className="text-xs" style={{ color: '#848E9C' }}>
                            {language === 'zh' ? '账户净值' : 'Total Equity'}
                          </div>
                          <div className="text-lg font-semibold mt-1" style={{ color: '#EAECEF' }}>
                            ${record.account_state.total_balance?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div className="rounded p-3" style={{ background: '#2B3139' }}>
                          <div className="text-xs" style={{ color: '#848E9C' }}>
                            {language === 'zh' ? '可用余额' : 'Available'}
                          </div>
                          <div className="text-lg font-semibold mt-1" style={{ color: '#EAECEF' }}>
                            ${record.account_state.available_balance?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div className="rounded p-3" style={{ background: '#2B3139' }}>
                          <div className="text-xs" style={{ color: '#848E9C' }}>
                            {language === 'zh' ? '持仓数' : 'Positions'}
                          </div>
                          <div className="text-lg font-semibold mt-1" style={{ color: '#EAECEF' }}>
                            {record.account_state.position_count || 0}
                          </div>
                        </div>
                        <div className="rounded p-3" style={{ background: '#2B3139' }}>
                          <div className="text-xs" style={{ color: '#848E9C' }}>
                            {language === 'zh' ? '保证金使用率' : 'Margin Used'}
                          </div>
                          <div className="text-lg font-semibold mt-1" style={{ color: '#EAECEF' }}>
                            {record.account_state.margin_used_pct?.toFixed(1) || '0.0'}%
                          </div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* 交易详情 */}
                    {record.decisions && Array.isArray(record.decisions) && record.decisions.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold mb-2" style={{ color: '#EAECEF' }}>
                        {language === 'zh' ? '交易详情' : 'Trade Details'}
                      </div>
                      <div className="space-y-2">
                        {record.decisions.map((decision, idx) => (
                          <div
                            key={idx}
                            className="rounded p-3"
                            style={{
                              background: '#2B3139',
                              border: `1px solid ${decision.success ? 'rgba(14, 203, 129, 0.2)' : 'rgba(246, 70, 93, 0.2)'}`,
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getActionIcon(decision.action)}
                                <span className="font-semibold" style={{ color: getActionColor(decision.action) }}>
                                  {decision.symbol || 'N/A'}
                                </span>
                                <span style={{ color: '#848E9C' }}>·</span>
                                <span style={{ color: '#EAECEF' }}>
                                  {getActionText(decision.action)}
                                </span>
                              </div>
                              <div className={`text-xs px-2 py-1 rounded ${decision.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {decision.success ? (language === 'zh' ? '成功' : 'Success') : (language === 'zh' ? '失败' : 'Failed')}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span style={{ color: '#848E9C' }}>{language === 'zh' ? '价格' : 'Price'}:</span>{' '}
                                <span style={{ color: '#EAECEF' }}>${decision.price?.toFixed(4) || '0.0000'}</span>
                              </div>
                              <div>
                                <span style={{ color: '#848E9C' }}>{language === 'zh' ? '数量' : 'Quantity'}:</span>{' '}
                                <span style={{ color: '#EAECEF' }}>{decision.quantity?.toFixed(6) || '0.000000'}</span>
                              </div>
                              {decision.leverage && decision.leverage > 0 && (
                                <div>
                                  <span style={{ color: '#848E9C' }}>{language === 'zh' ? '杠杆' : 'Leverage'}:</span>{' '}
                                  <span style={{ color: '#EAECEF' }}>{decision.leverage}x</span>
                                </div>
                              )}
                              {decision.order_id && decision.order_id > 0 && (
                                <div>
                                  <span style={{ color: '#848E9C' }}>{language === 'zh' ? '订单' : 'Order'}:</span>{' '}
                                  <span className="font-mono text-xs" style={{ color: '#EAECEF' }}>
                                    {decision.order_id}
                                  </span>
                                </div>
                              )}
                            </div>
                            {decision.error && (
                              <div className="mt-2 text-xs" style={{ color: '#F6465D' }}>
                                {decision.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* 执行日志 */}
                    {record.execution_log && record.execution_log.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold mb-2" style={{ color: '#EAECEF' }}>
                          {language === 'zh' ? '执行日志' : 'Execution Log'}
                        </div>
                        <div className="rounded p-3 font-mono text-xs space-y-1" style={{ background: '#2B3139' }}>
                          {record.execution_log.map((log, idx) => (
                            <div key={idx} style={{ color: log.includes('✓') ? '#0ECB81' : log.includes('❌') ? '#F6465D' : '#848E9C' }}>
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 错误信息 */}
                    {record.error_message && (
                      <div
                        className="rounded p-3"
                        style={{
                          background: 'rgba(246, 70, 93, 0.1)',
                          border: '1px solid rgba(246, 70, 93, 0.2)',
                        }}
                      >
                        <div className="text-sm font-semibold mb-1" style={{ color: '#F6465D' }}>
                          {language === 'zh' ? '错误信息' : 'Error Message'}
                        </div>
                        <div className="text-sm" style={{ color: '#F6465D' }}>
                          {record.error_message}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

