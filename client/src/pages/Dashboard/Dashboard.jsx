import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Row, Col, Card, Statistic, Typography, Spin, Tag, List, Badge, Skeleton,
  Empty, Button, Segmented, Dropdown, Space, Tooltip, Drawer, Popover, Modal
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, ProjectOutlined, FileTextOutlined,
  TeamOutlined, DollarOutlined, WalletOutlined, CrownOutlined,
  ReloadOutlined, WarningOutlined, InfoCircleOutlined, BankOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  BellOutlined, PrinterOutlined, DownloadOutlined, FilterOutlined,
  MinusOutlined, DragOutlined, SettingOutlined, EyeOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
  ComposedChart, Area
} from 'recharts';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const rtlStyle = { fontFamily: 'Cairo, sans-serif' };

// ===================== HELPERS =====================

const formatCurrency = (v) => v?.toLocaleString?.() || '0';
const kpiArrow = (trend) => trend === 'up' ? <ArrowUpOutlined style={{ color: '#10b981' }} /> :
  trend === 'down' ? <ArrowDownOutlined style={{ color: '#ef4444' }} /> : <MinusOutlined style={{ color: '#94a3b8' }} />;
const kpiColor = (trend) => trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8';

// ===================== KPI CARD =====================

const KPICard = ({ title, value, prefix, suffix, change, trend, icon, color, yoy }) => (
  <Card
    size="small"
    style={{ borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }}
    bodyStyle={{ padding: '16px 20px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <Text type="secondary" style={{ fontSize: 12, ...rtlStyle }}>{title}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, margin: '4px 0', ...rtlStyle, color: '#1e293b' }}>
          {prefix}{formatCurrency(value)}{suffix}
        </div>
        {change !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {kpiArrow(trend)}
            <Text style={{ fontSize: 13, color: kpiColor(trend), ...rtlStyle }}>
              {Math.abs(change)}% {trend === 'up' ? 'ارتفاع' : trend === 'down' ? 'انخفاض' : 'ثبات'}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, ...rtlStyle }}>من الشهر الماضي</Text>
          </div>
        )}
        {yoy !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text style={{ fontSize: 11, color: kpiColor(yoy.trend), ...rtlStyle }}>
              مقارنة سنوية: {yoy.trend === 'up' ? '▲' : yoy.trend === 'down' ? '▼' : '–'} {Math.abs(yoy.value)}%
            </Text>
          </div>
        )}
      </div>
      {icon && <div style={{ fontSize: 28, color: color || '#3b82f6', opacity: 0.6 }}>{icon}</div>}
    </div>
  </Card>
);

// ===================== STAT ROW =====================

const StatCard = ({ col, title, value, prefix, suffix, change, trend, icon, color }) => (
  <Col xs={24} sm={12} md={col || 6}>
    <Card
      size="small"
      style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon && <span style={{ fontSize: 18, color: color || '#3b82f6' }}>{icon}</span>}
        <Text type="secondary" style={{ fontSize: 13, ...rtlStyle }}>{title}</Text>
      </div>
      <Statistic
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ fontSize: 22, fontWeight: 700, ...rtlStyle, color: '#1e293b' }}
      />
      {change !== undefined && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          {kpiArrow(trend)}
          <Text style={{ fontSize: 12, color: kpiColor(trend), ...rtlStyle }}>{Math.abs(change)}%</Text>
        </div>
      )}
    </Card>
  </Col>
);

// ===================== SKELETON =====================

const DashboardSkeleton = () => (
  <div style={rtlStyle}>
    <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
    <Row gutter={[16, 16]}>
      {[1, 2, 3, 4].map(i => (
        <Col xs={24} sm={12} md={6} key={i}><Card><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>
      ))}
    </Row>
  </div>
);

// ===================== TIME FILTER =====================

const TimeFilter = ({ value, onChange }) => (
  <Segmented
    value={value}
    onChange={onChange}
    options={[
      { label: 'اليوم', value: 'day' },
      { label: 'الأسبوع', value: 'week' },
      { label: 'الشهر', value: 'month' },
      { label: 'السنة', value: 'year' },
    ]}
  />
);

// ===================== NOTIFICATIONS PANEL =====================

const NotificationsPopover = ({ notifications, unreadCount, loading }) => (
  <Popover
    trigger="click"
    placement="bottomLeft"
    title={<Text strong style={rtlStyle}>🔔 الإشعارات الأخيرة</Text>}
    content={
      <div style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
        {loading ? <Spin /> : notifications?.length === 0 ? (
          <Empty description="لا توجد إشعارات" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={n => (
              <List.Item style={{ padding: '8px 0' }}>
                <div>
                  <Text style={{ fontSize: 13, ...rtlStyle }}>{n.title || n.message}</Text>
                  {n.createdAt && (
                    <br />
                  )}
                  {n.createdAt && <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(n.createdAt).fromNow()}</Text>}
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    }
  >
    <Badge count={unreadCount} size="small" offset={[-4, 4]}>
      <Button icon={<BellOutlined />} size="small" style={{ borderRadius: 8 }} />
    </Badge>
  </Popover>
);

// ===================== ADMIN DASHBOARD =====================

const AdminDashboard = ({ data, loading, onRefresh, timeRange, onTimeChange }) => {
  const [widgetOrder, setWidgetOrder] = useState([
    'monthlyChart', 'forecastChart', 'incomeBySource', 'projectStatus'
  ]);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, yoy, charts, alerts, notifications, recentTransactions } = data;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(widgetOrder);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setWidgetOrder(items);
  };

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    try {
      const res = await api.get('/dashboard/export');
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `dashboard-export-${dayjs().format('YYYY-MM-DD')}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }
  };

  return (
    <div style={rtlStyle} className="dashboard-printable">
      {/* HEADER */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>🌟 لوحة التحكم العامة</Title>
          <Paragraph style={{ margin: '4px 0 0', color: '#64748b', ...rtlStyle }}>
            مرحباً بك في نظام غايتك المالي والتشغيلي المتكامل
          </Paragraph>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <NotificationsPopover
            notifications={notifications}
            unreadCount={notifications?.length || 0}
            loading={loading}
          />
          <TimeFilter value={timeRange} onChange={onTimeChange} />
          <Tooltip title="تحديث"><Button icon={<ReloadOutlined />} onClick={onRefresh} size="small" /></Tooltip>
          <Tooltip title="طباعة"><Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" /></Tooltip>
          <Tooltip title="تصدير"><Button icon={<DownloadOutlined />} onClick={handleExportPDF} size="small" /></Tooltip>
        </div>
      </div>

      {/* KPI Cards - Row 1 with YoY */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <KPICard title="💰 الإيرادات هذا الشهر" value={stats.revenue.value} prefix="$"
            change={stats.revenue.change} trend={stats.revenue.trend} yoy={yoy?.revenue}
            icon={<DollarOutlined />} color="#10b981" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KPICard title="💸 المصاريف هذا الشهر" value={stats.expenses.value} prefix="$"
            change={stats.expenses.change} trend={stats.expenses.trend} yoy={yoy?.expenses}
            icon={<WalletOutlined />} color="#ef4444" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KPICard title="📈 صافي الربح" value={stats.netProfit.value} prefix="$"
            change={stats.netProfit.change} trend={stats.netProfit.trend}
            icon={<CrownOutlined />} color="#3b82f6" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KPICard title="🏦 رصيد الشركة" value={stats.totalBalance.value} prefix="$"
            icon={<BankOutlined />} color="#3b82f6" />
        </Col>
      </Row>

      {/* KPI Cards - Row 2 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <StatCard col={6} title="📋 عقود نشطة" value={stats.activeContracts.value} icon={<FileTextOutlined />} color="#f59e0b" />
        <StatCard col={6} title="🚀 مشاريع نشطة" value={stats.activeProjects.value} icon={<ProjectOutlined />} color="#3b82f6" />
        <StatCard col={6} title="👥 عملاء نشطون" value={stats.activeClients.value} icon={<TeamOutlined />} color="#10b981" />
        <StatCard col={6} title="⏰ فواتير متأخرة" value={stats.overdueInvoices.count}
          suffix={stats.overdueInvoices.total > 0 ? ` / $${stats.overdueInvoices.total.toLocaleString()}` : ''}
          icon={<ExclamationCircleOutlined />} color="#ef4444" />
      </Row>

      {/* DRAGGABLE WIDGETS - Charts Section */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-widgets" direction="horizontal">
          {(provided) => (
            <Row gutter={[16, 16]} style={{ marginTop: 20 }} ref={provided.innerRef} {...provided.droppableProps}>
              {widgetOrder.map((widgetId, index) => {
                let widgetContent = null;
                switch (widgetId) {
                  case 'monthlyChart':
                    widgetContent = (
                      <Card
                        title={<span style={rtlStyle}>📊 الإيرادات والمصاريف (آخر 12 شهر)</span>}
                        extra={<DragOutlined />}
                        size="small" style={{ borderRadius: 12, height: '100%' }}
                      >
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={charts.monthly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ReTooltip formatter={(v) => `$${v.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="revenue" name="الإيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" name="المصاريف" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </Card>
                    );
                    break;
                  case 'forecastChart':
                    widgetContent = (
                      <Card
                        title={<span style={rtlStyle}>🔮 التنبؤ المالي (3 شهور قادمة)</span>}
                        extra={<DragOutlined />}
                        size="small" style={{ borderRadius: 12, height: '100%' }}
                      >
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={[...(charts.monthly || []), ...(charts.forecast || [])]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ReTooltip formatter={(v, name) => [`$${v.toLocaleString()}`, name === 'revenue' ? 'الإيرادات' : 'المصاريف']} />
                            <Legend />
                            <Bar dataKey="revenue" name="الإيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" name="المصاريف" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            {charts.forecast?.length > 0 && (
                              <Area type="monotone" dataKey="revenue" name="متوقع الإيرادات"
                                stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeDasharray="5 5" />
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </Card>
                    );
                    break;
                  case 'incomeBySource':
                    widgetContent = (
                      <Card
                        title={<span style={rtlStyle}>📥 توزيع الدخل حسب المصدر</span>}
                        extra={<DragOutlined />}
                        size="small" style={{ borderRadius: 12, height: '100%' }}
                      >
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={charts.incomeBySource} dataKey="total" nameKey="_id"
                              cx="50%" cy="50%" outerRadius={100} label={({ _id, total }) => `${_id}: $${total.toLocaleString()}`}>
                              {charts.incomeBySource?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <ReTooltip formatter={(v) => `$${v.toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    );
                    break;
                  case 'projectStatus':
                    widgetContent = (
                      <Card
                        title={<span style={rtlStyle}>📋 حالة المشاريع</span>}
                        extra={<DragOutlined />}
                        size="small" style={{ borderRadius: 12, height: '100%' }}
                      >
                        {charts.projectStatus?.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie data={charts.projectStatus} dataKey="count" nameKey="_id"
                                cx="50%" cy="50%" outerRadius={100} label={({ _id, count }) => `${_id}: ${count}`}>
                                {charts.projectStatus?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <ReTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <Empty description="لا توجد مشاريع" />
                        )}
                      </Card>
                    );
                    break;
                  default:
                    widgetContent = null;
                }

                return (
                  <Draggable key={widgetId} draggableId={widgetId} index={index}>
                    {(provided) => (
                      <Col
                        xs={24} lg={12}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ ...provided.draggableProps.style }}
                      >
                        {widgetContent}
                      </Col>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </Row>
          )}
        </Droppable>
      </DragDropContext>

      {/* BOTTOM ROW: Alerts + Recent Transactions */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {/* Alerts */}
        <Col xs={24} md={8}>
          <Card
            title={<span style={rtlStyle}>⚠️ تنبيهات</span>}
            size="small" style={{ borderRadius: 12 }}
          >
            {alerts?.length > 0 ? (
              <List
                dataSource={alerts}
                renderItem={a => (
                  <List.Item>
                    <Tag color={a.type === 'warning' ? 'orange' : 'blue'}>{a.icon}</Tag>
                    <Text style={{ fontSize: 13, ...rtlStyle }}>{a.message}</Text>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="لا توجد تنبيهات" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Recent Transactions */}
        <Col xs={24} md={16}>
          <Card
            title={<span style={rtlStyle}>🔄 آخر المعاملات</span>}
            size="small" style={{ borderRadius: 12 }}
          >
            {recentTransactions?.length > 0 ? (
              <List
                dataSource={recentTransactions}
                renderItem={t => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <Tag color={t.type === 'income' ? 'green' : 'red'}>
                        {t.type === 'income' ? 'دخل' : 'مصروف'}
                      </Tag>
                      <Text style={{ flex: 1, ...rtlStyle }}>{t.clientName || t.projectName || '—'}</Text>
                      <Text strong style={{ color: t.type === 'income' ? '#10b981' : '#ef4444', ...rtlStyle }}>
                        {t.type === 'income' ? '+' : '-'}${t.amount?.toLocaleString()}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(t.date).format('YYYY/MM/DD')}</Text>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="لا توجد معاملات" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Account Balances */}
      {charts.accountBalances?.length > 0 && (
        <Card
          title={<span style={rtlStyle}>💳 أرصدة الحسابات</span>}
          size="small" style={{ borderRadius: 12, marginTop: 16 }}
        >
          <Row gutter={[12, 12]}>
            {charts.accountBalances.map((acc, i) => (
              <Col xs={24} sm={12} md={6} key={i}>
                <Card size="small" style={{ background: '#f8fafc' }}>
                  <Text style={{ fontSize: 13, ...rtlStyle }}>{acc.name}</Text>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {acc.currency} {acc.balance?.toLocaleString()}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
};

// ===================== FINANCE DASHBOARD =====================

const FinanceDashboard = ({ data, loading, onRefresh, timeRange, onTimeChange }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, kpi, balance, charts, pendingInvoices, recentCollections } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>📊 لوحة التحكم المالية</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TimeFilter value={timeRange} onChange={onTimeChange} />
          <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small" />
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <KPICard title="💰 الإيرادات" value={stats.revenue} prefix="$"
            change={kpi?.revenue?.value} trend={kpi?.revenue?.trend} icon={<DollarOutlined />} color="#10b981" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KPICard title="💸 المصاريف" value={stats.expenses} prefix="$"
            change={kpi?.expenses?.value} trend={kpi?.expenses?.trend} icon={<WalletOutlined />} color="#ef4444" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KPICard title="📈 صافي الربح" value={stats.netProfit} prefix="$"
            change={kpi?.netProfit?.value} trend={kpi?.netProfit?.trend} icon={<CrownOutlined />} color="#3b82f6" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KPICard title="💳 الديون المستحقة" value={stats.totalDebt} prefix="$"
            suffix={` (${stats.debtCount})`} icon={<ExclamationCircleOutlined />} color="#f59e0b" />
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>📊 الإيرادات والمصاريف</span>} size="small" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={[...(charts?.monthly || []), ...(charts?.forecast || [])]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Bar dataKey="revenue" name="الإيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="المصاريف" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>📥 توزيع المصاريف</span>} size="small" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={charts?.expensesByCategory} dataKey="total" nameKey="_id"
                  cx="50%" cy="50%" outerRadius={100}>
                  {charts?.expensesByCategory?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ReTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Pending Invoices */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={<span style={rtlStyle}>📄 فواتير معلقة</span>} size="small" style={{ borderRadius: 12 }}>
            {pendingInvoices?.length > 0 ? (
              <List
                dataSource={pendingInvoices.slice(0, 5)}
                renderItem={inv => (
                  <List.Item>
                    <Text style={rtlStyle}>{inv.invoiceNumber} - {inv.client?.name}</Text>
                    <Text strong>${inv.total?.toLocaleString()}</Text>
                  </List.Item>
                )}
              />
            ) : <Empty description="لا توجد فواتير معلقة" />}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span style={rtlStyle}>✅ آخر التحصيلات</span>} size="small" style={{ borderRadius: 12 }}>
            {recentCollections?.length > 0 ? (
              <List
                dataSource={recentCollections.slice(0, 5)}
                renderItem={tx => (
                  <List.Item>
                    <Text style={rtlStyle}>{tx.client?.name || '—'}</Text>
                    <Text strong style={{ color: '#10b981' }}>+${tx.amount?.toLocaleString()}</Text>
                  </List.Item>
                )}
              />
            ) : <Empty description="لا توجد تحصيلات حديثة" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== PM DASHBOARD =====================

const PMDashboard = ({ data, loading, onRefresh, timeRange, onTimeChange }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, projectStatus, projects } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>🚀 لوحة إدارة المشاريع</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TimeFilter value={timeRange} onChange={onTimeChange} />
          <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small" />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <StatCard col={6} title="🚀 مشاريع نشطة" value={stats.activeProjects} icon={<ProjectOutlined />} color="#3b82f6" />
        <StatCard col={6} title="✅ مشاريع مكتملة" value={stats.completedProjects} icon={<CheckCircleOutlined />} color="#10b981" />
        <StatCard col={6} title="📋 عقود نشطة" value={stats.activeContracts} icon={<FileTextOutlined />} color="#f59e0b" />
        <StatCard col={6} title="⏳ مهام معلقة" value={stats.pendingTasks} icon={<ClockCircleOutlined />} color="#ef4444" />
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <StatCard col={6} title="👥 عملاء نشطون" value={stats.activeClients} icon={<TeamOutlined />} color="#8b5cf6" />
        <StatCard col={6} title="🏁 عقود منتهية" value={stats.endedContracts} icon={<FileTextOutlined />} color="#94a3b8" />
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={8}>
          <Card title={<span style={rtlStyle}>📊 حالة المشاريع</span>} size="small" style={{ borderRadius: 12 }}>
            {projectStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={projectStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80}>
                    {projectStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title={<span style={rtlStyle}>📋 آخر المشاريع</span>} size="small" style={{ borderRadius: 12 }}>
            {projects?.length > 0 ? (
              <List
                dataSource={projects.slice(0, 8)}
                renderItem={p => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <Text strong style={rtlStyle}>{p.name}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Tag color={p.status === 'active' ? 'green' : p.status === 'completed' ? 'blue' : 'default'}>
                          {p.status === 'active' ? 'نشط' : p.status === 'completed' ? 'مكتمل' : p.status}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
                          {p.tasks?.length || 0} مهام
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : <Empty description="لا توجد مشاريع" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== ACCOUNTANT DASHBOARD =====================

const AccountantDashboard = ({ data, loading, onRefresh, timeRange, onTimeChange }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, charts, dueInvoices, recentExpenses } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>🧾 لوحة المحاسب</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TimeFilter value={timeRange} onChange={onTimeChange} />
          <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small" />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <StatCard col={6} title="📄 فواتير معلقة" value={stats.pendingInvoices} icon={<FileTextOutlined />} color="#f59e0b" />
        <StatCard col={6} title="💸 مصاريف الشهر" value={stats.monthlyExpenses} prefix="$" icon={<WalletOutlined />} color="#ef4444" />
        <StatCard col={6} title="💳 مدفوعات جزئية" value={stats.pendingPayments} icon={<ClockCircleOutlined />} color="#3b82f6" />
        <StatCard col={6} title="🏦 الرصيد" value={stats.totalBalance} prefix="$" icon={<BankOutlined />} color="#10b981" />
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title={<span style={rtlStyle}>📄 فواتير مستحقة قريباً</span>} size="small" style={{ borderRadius: 12 }}>
            {dueInvoices?.length > 0 ? (
              <List
                dataSource={dueInvoices.slice(0, 5)}
                renderItem={inv => (
                  <List.Item>
                    <Text style={rtlStyle}>{inv.invoiceNumber} - {inv.client?.name}</Text>
                    <Text strong>$ {inv.total?.toLocaleString()}</Text>
                  </List.Item>
                )}
              />
            ) : <Empty description="لا توجد فواتير مستحقة" />}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span style={rtlStyle}>💸 آخر المصاريف</span>} size="small" style={{ borderRadius: 12 }}>
            {recentExpenses?.length > 0 ? (
              <List
                dataSource={recentExpenses.slice(0, 5)}
                renderItem={exp => (
                  <List.Item>
                    <Text style={rtlStyle}>{exp.description || exp.category}</Text>
                    <Text strong style={{ color: '#ef4444' }}>-${exp.amount?.toLocaleString()}</Text>
                  </List.Item>
                )}
              />
            ) : <Empty description="لا توجد مصاريف" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== EMPLOYEE DASHBOARD =====================

const EmployeeDashboard = ({ data, loading, onRefresh }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, tasks, salaries, employee } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>
            👋 مرحباً {employee?.name || '...'}
          </Title>
          <Text type="secondary" style={rtlStyle}>{employee?.department || ''}</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small" />
      </div>

      <Row gutter={[16, 16]}>
        <StatCard col={6} title="💵 الراتب" value={stats.salary} prefix="$" icon={<DollarOutlined />} color="#10b981" />
        <StatCard col={6} title="💰 السلف المتبقية" value={stats.advance} prefix="$" icon={<WalletOutlined />} color="#f59e0b" />
        <StatCard col={6} title="📋 مهام قيد التنفيذ" value={stats.activeTasks} icon={<ClockCircleOutlined />} color="#3b82f6" />
        <StatCard col={6} title="✅ مهام مكتملة" value={stats.completedTasks} icon={<CheckCircleOutlined />} color="#10b981" />
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title={<span style={rtlStyle}>📋 مهامي</span>} size="small" style={{ borderRadius: 12 }}>
            {tasks?.length > 0 ? (
              <List
                dataSource={tasks.slice(0, 5)}
                renderItem={t => (
                  <List.Item>
                    <div>
                      <Text style={rtlStyle}>{t.title}</Text>
                      <div>
                        <Tag color={t.status === 'completed' ? 'green' : t.status === 'in_progress' ? 'blue' : 'default'}>
                          {t.status === 'completed' ? 'مكتمل' : t.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>{t.projectName}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : <Empty description="لا توجد مهام" />}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span style={rtlStyle}>💵 آخر الرواتب</span>} size="small" style={{ borderRadius: 12 }}>
            {salaries?.length > 0 ? (
              <List
                dataSource={salaries.slice(0, 6)}
                renderItem={s => (
                  <List.Item>
                    <Text style={rtlStyle}>{s.month} {s.year}</Text>
                    <Text strong style={{ color: '#10b981' }}>$ {s.amount?.toLocaleString()}</Text>
                  </List.Item>
                )}
              />
            ) : <Empty description="لا توجد رواتب" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== MAIN DASHBOARD =====================

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role || 'employee';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const intervalRef = useRef(null);

  const fetchDashboard = useCallback(async (range) => {
    const r = range || timeRange;
    const endpointMap = {
      admin: '/api/dashboard/admin',
      finance: '/api/dashboard/finance',
      pm: '/api/dashboard/pm',
      accountant: '/api/dashboard/accountant',
      employee: '/api/dashboard/employee',
    };
    const endpoint = endpointMap[role] || endpointMap.employee;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${endpoint}?range=${r}`);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل لوحة التحكم');
    } finally {
      setLoading(false);
    }
  }, [role, timeRange]);

  // Initial fetch + auto-refresh every 30s — re-fetch when user role changes
  useEffect(() => {
    if (!user) return;  // wait for auth to load
    setData(null);      // clear stale data from previous role
    fetchDashboard();

    intervalRef.current = setInterval(() => {
      fetchDashboard(timeRange);
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [role]); // eslint-disable-line

  // Fetch when time range changes
  useEffect(() => {
    if (data !== null) fetchDashboard(timeRange);
  }, [timeRange]); // eslint-disable-line

  const handleTimeChange = (val) => {
    setTimeRange(val);
  };

  const handleRefresh = () => fetchDashboard(timeRange);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40, ...rtlStyle }}>
        <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ef4444' }} />
        <Title level={4} style={{ marginTop: 16, ...rtlStyle }}>{error}</Title>
        <Button type="primary" onClick={handleRefresh}>إعادة المحاولة</Button>
      </div>
    );
  }

  switch (role) {
    case 'admin':
      return <AdminDashboard data={data} loading={loading && !data} onRefresh={handleRefresh}
        timeRange={timeRange} onTimeChange={handleTimeChange} />;
    case 'finance':
      return <FinanceDashboard data={data} loading={loading && !data} onRefresh={handleRefresh}
        timeRange={timeRange} onTimeChange={handleTimeChange} />;
    case 'pm':
      return <PMDashboard data={data} loading={loading && !data} onRefresh={handleRefresh}
        timeRange={timeRange} onTimeChange={handleTimeChange} />;
    case 'accountant':
      return <AccountantDashboard data={data} loading={loading && !data} onRefresh={handleRefresh}
        timeRange={timeRange} onTimeChange={handleTimeChange} />;
    case 'employee':
    default:
      return <EmployeeDashboard data={data} loading={loading && !data} onRefresh={handleRefresh} />;
  }
};

export default Dashboard;
