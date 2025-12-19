
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Settings, 
  Download, 
  Upload, 
  Plus, 
  Edit2, 
  Trash2, 
  Sun, 
  Moon, 
  Palette,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  List,
  CalendarDays
} from 'lucide-react';
import { 
  ScheduleType, 
  FarmingTask, 
  ThemeMode, 
  ColorPalette, 
  SCHEDULE_LABELS, 
  THEME_COLORS 
} from './types';
import { MONTHS_TO_DISPLAY, WEEKDAYS, TXT_TEMPLATE_HEADER } from './constants';
import { getCalendarGrid, formatDate, parseTxtData } from './utils/dateHelpers';

// 定义各类型的固定配色方案
const CATEGORY_COLORS: Record<ScheduleType, { bg: string; text: string; border: string; active: string; light: string }> = {
  science: {
    bg: 'bg-blue-500',
    text: 'text-blue-700',
    border: 'border-blue-200',
    active: 'bg-blue-600',
    light: 'bg-blue-50'
  },
  reclamation: {
    bg: 'bg-purple-500',
    text: 'text-purple-700',
    border: 'border-purple-200',
    active: 'bg-purple-600',
    light: 'bg-purple-50'
  },
  local: {
    bg: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-amber-200',
    active: 'bg-amber-600',
    light: 'bg-amber-50'
  },
  custom: {
    bg: 'bg-emerald-500', // 默认，会随主题色变化
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    active: 'bg-emerald-600',
    light: 'bg-emerald-50'
  }
};

// 弹窗组件
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const currentYear = new Date().getFullYear();
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [palette, setPalette] = useState<ColorPalette>('green');
  const [year, setYear] = useState(currentYear);
  
  const [visibleLayers, setVisibleLayers] = useState<Record<ScheduleType, boolean>>({
    science: true,
    reclamation: true,
    local: true,
    custom: true
  });
  
  const [schedules, setSchedules] = useState<Record<ScheduleType, FarmingTask[]>>({
    science: [],
    reclamation: [],
    local: [],
    custom: []
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<FarmingTask> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [viewMode, setViewMode] = useState<'daily' | 'category'>('daily');
  const [activeCategory, setActiveCategory] = useState<ScheduleType | null>(null);

  // 初始化：调用根目录文件 01.txt, 02.txt, 03.txt, 04.txt
  useEffect(() => {
    const fetchSchedules = async () => {
      const files: Record<ScheduleType, string> = {
        science: '01.txt',
        reclamation: '02.txt',
        local: '03.txt',
        custom: '04.txt'
      };

      const newSchedules: Record<ScheduleType, FarmingTask[]> = {
        science: [], reclamation: [], local: [], custom: []
      };

      for (const [key, fileName] of Object.entries(files)) {
        try {
          const response = await fetch(`./${fileName}`);
          if (response.ok) {
            const content = await response.text();
            newSchedules[key as ScheduleType] = parseTxtData(content, key);
          }
        } catch (err) {
          console.error(`Failed to fetch ${fileName}`, err);
        }
      }

      const localCustom = localStorage.getItem('soybean_custom_v4');
      if (localCustom) {
        newSchedules.custom = JSON.parse(localCustom);
      }

      setSchedules(newSchedules);
    };

    fetchSchedules();
  }, []);

  useEffect(() => {
    if (schedules.custom.length > 0) {
      localStorage.setItem('soybean_custom_v4', JSON.stringify(schedules.custom));
    }
  }, [schedules.custom]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const activeColor = THEME_COLORS[palette];

  // 动态更新自定义类型的颜色（跟随主题）
  const getCategoryStyles = (type: ScheduleType) => {
    if (type === 'custom') {
      return {
        bg: activeColor.bg,
        text: `text-${activeColor.primary}`,
        border: `border-${activeColor.border}`,
        active: activeColor.bg,
        light: `bg-${activeColor.light}`
      };
    }
    return CATEGORY_COLORS[type];
  };

  const handleCategoryAction = (type: ScheduleType) => {
    setVisibleLayers(prev => ({ ...prev, [type]: true }));
    setViewMode('category');
    setActiveCategory(type);
  };

  const toggleLayerVisibilityOnly = (e: React.MouseEvent, type: ScheduleType) => {
    e.stopPropagation();
    setVisibleLayers(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleFileUpload = (type: ScheduleType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseTxtData(content, type);
      setSchedules(prev => ({ ...prev, [type]: parsed }));
      handleCategoryAction(type);
    };
    reader.readAsText(file);
  };

  const handleExport = (type: ScheduleType) => {
    const data = schedules[type];
    const content = TXT_TEMPLATE_HEADER + data.map(t => `${t.startDate}|${t.endDate}|${t.activity}|${t.notes}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'science' ? '01' : type === 'reclamation' ? '02' : type === 'local' ? '03' : '04'}.txt`;
    link.click();
  };

  const saveTask = () => {
    if (!editingTask?.activity || !editingTask?.startDate || !editingTask?.endDate) return;
    const newTask: FarmingTask = {
      id: editingTask.id || `custom-${Date.now()}`,
      startDate: editingTask.startDate,
      endDate: editingTask.endDate,
      activity: editingTask.activity,
      notes: editingTask.notes || '',
      type: 'custom'
    };
    setSchedules(prev => ({
      ...prev,
      custom: [...prev.custom.filter(t => t.id !== newTask.id), newTask]
    }));
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const deleteTask = (id: string) => {
    setSchedules(prev => ({
      ...prev,
      custom: prev.custom.filter(t => t.id !== id)
    }));
  };

  const isDateInRange = (dateStr: string, start: string, end: string) => dateStr >= start && dateStr <= end;

  const renderMonthGrid = (monthIndex: number) => {
    const days = getCalendarGrid(year, monthIndex);
    const monthName = new Intl.DateTimeFormat('zh-CN', { month: 'long' }).format(new Date(year, monthIndex));
    
    return (
      <div key={monthIndex} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-transform hover:scale-[1.01]">
        <div className={`p-4 text-center font-extrabold text-lg text-white ${activeColor.bg} shadow-inner`}>
          {year}年 {monthName}
        </div>
        <div className="calendar-grid text-center py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {WEEKDAYS.map(w => (
            // Fixed: Syntax error was here (key(w} changed to key={w})
            <div key={w} className="text-xs font-bold text-gray-500 dark:text-gray-400">{w}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((day, idx) => {
            const dateStr = formatDate(day);
            const isCurrentMonth = day.getMonth() === monthIndex;
            
            const dayTasks = (Object.keys(schedules) as ScheduleType[]).flatMap(type => {
              if (!visibleLayers[type]) return [];
              return schedules[type].filter(t => isDateInRange(dateStr, t.startDate, t.endDate));
            });

            return (
              <div 
                key={idx} 
                onClick={() => { setSelectedDate(dateStr); setViewMode('daily'); setActiveCategory(null); }}
                className={`min-h-[100px] p-1 border-r border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/30 opacity-20'}
                  ${viewMode === 'daily' && selectedDate === dateStr ? 'ring-2 ring-inset ring-' + activeColor.primary + ' bg-' + activeColor.light + '/20' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-700/50
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-bold ${isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                    {day.getDate()}
                  </span>
                  {isCurrentMonth && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingTask({ startDate: dateStr, endDate: dateStr, activity: '', notes: '', type: 'custom' }); setIsModalOpen(true); }}
                      className="text-gray-300 hover:text-emerald-500 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-[70px] overflow-y-auto hide-scrollbar">
                  {dayTasks.map(task => {
                    const styles = getCategoryStyles(task.type);
                    return (
                      <div 
                        key={task.id}
                        className={`text-[10px] truncate leading-tight rounded-md px-1.5 py-0.5 border shadow-sm text-white font-medium ${styles.bg} border-white/20`}
                      >
                        {task.activity.slice(0, 6)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const tasksToDisplay = useMemo(() => {
    if (viewMode === 'category' && activeCategory) {
      return [...schedules[activeCategory]].sort((a, b) => a.startDate.localeCompare(b.startDate));
    }
    return (Object.keys(schedules) as ScheduleType[]).flatMap(type => {
      if (!visibleLayers[type]) return [];
      return schedules[type].filter(t => isDateInRange(selectedDate, t.startDate, t.endDate));
    });
  }, [schedules, selectedDate, viewMode, activeCategory, visibleLayers]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      <header className={`sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm transition-all`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white shadow-lg ${activeColor.bg}`}>
            <CalendarIcon size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">大豆农时智慧排期系统</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">调用根目录 01.txt - 04.txt</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
          {(Object.keys(SCHEDULE_LABELS) as ScheduleType[]).map(type => {
            const styles = getCategoryStyles(type);
            const isActive = activeCategory === type;
            return (
              <button
                key={type}
                onClick={() => handleCategoryAction(type)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border
                  ${isActive 
                    ? `${styles.bg} text-white shadow-md scale-105 border-transparent` 
                    : `bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-200`}`}
              >
                <div 
                  onClick={(e) => toggleLayerVisibilityOnly(e, type)}
                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all
                    ${visibleLayers[type] ? (isActive ? 'bg-white text-gray-900' : `${styles.bg} text-white border-transparent`) : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
                >
                  {visibleLayers[type] && <CheckCircle2 size={12} />}
                </div>
                {SCHEDULE_LABELS[type]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={() => setTheme('light')} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}><Sun size={18} /></button>
            <button onClick={() => setTheme('dark')} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-gray-700 shadow-sm text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}><Moon size={18} /></button>
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={() => setPalette('green')} className={`p-2 rounded-lg transition-all ${palette === 'green' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}><Palette size={18} /></button>
            <button onClick={() => setPalette('orange')} className={`p-2 rounded-lg transition-all ${palette === 'orange' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-400'}`}><Palette size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {MONTHS_TO_DISPLAY.map(m => renderMonthGrid(m))}
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className={`px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6 border-b dark:border-gray-800 ${activeColor.bg} bg-opacity-5`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${activeColor.bg} text-white shadow-lg`}>
                {viewMode === 'daily' ? <CalendarDays size={24} /> : <List size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                  {viewMode === 'daily' ? `${selectedDate} 农事看板` : `${activeCategory ? SCHEDULE_LABELS[activeCategory] : ''} 全量清单`}
                </h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                  正在查看 {activeCategory ? `文件 ${activeCategory === 'science' ? '01' : activeCategory === 'reclamation' ? '02' : activeCategory === 'local' ? '03' : '04'}.txt` : '多图层汇总显示'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => handleExport(activeCategory || 'custom')} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-5 py-2.5 rounded-2xl shadow-sm border dark:border-gray-700 hover:bg-gray-50 transition-all font-bold">
                <Download size={20} className={`text-${activeColor.primary}`} />
                <span>导出 TXT</span>
              </button>
              <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-800 px-5 py-2.5 rounded-2xl shadow-sm border dark:border-gray-700 hover:bg-gray-50 transition-all font-bold">
                <Upload size={20} className={`text-${activeColor.primary}`} />
                <span>覆盖导入</span>
                <input type="file" accept=".txt" className="hidden" onChange={(e) => handleFileUpload(activeCategory || 'custom', e)} />
              </label>
              <button onClick={() => { setEditingTask({ startDate: selectedDate, endDate: selectedDate, activity: '', notes: '', type: 'custom' }); setIsModalOpen(true); }} className={`flex items-center gap-2 ${activeColor.bg} text-white px-6 py-2.5 rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all font-bold`}>
                <Plus size={20} />
                <span>新增自定义</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {tasksToDisplay.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tasksToDisplay.map(task => {
                  const styles = getCategoryStyles(task.type);
                  return (
                    <div key={task.id} className={`p-6 rounded-3xl border transition-all hover:shadow-xl hover:-translate-y-1 ${task.type === 'custom' ? `border-${activeColor.border} ${styles.light} dark:bg-emerald-900/10` : `border-gray-100 ${styles.light} dark:bg-gray-800/50 dark:border-gray-700`}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-white ${styles.bg}`}>
                          {SCHEDULE_LABELS[task.type]}
                        </span>
                        {task.type === 'custom' && (
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-emerald-500 bg-white dark:bg-gray-800 rounded-xl shadow-sm"><Edit2 size={16} /></button>
                            <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-rose-500 bg-white dark:bg-gray-800 rounded-xl shadow-sm"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>
                      <h4 className={`text-xl font-black mb-2 ${styles.text} dark:text-white`}>{task.activity}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 font-bold bg-white/50 dark:bg-gray-900/50 p-2 rounded-xl">
                        <Clock size={16} className={styles.text} />
                        {task.startDate === task.endDate ? task.startDate : `${task.startDate} ~ ${task.endDate}`}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{task.notes}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center text-gray-300 dark:text-gray-700">
                <Settings size={80} className="mb-6 opacity-20" />
                <p className="text-lg font-bold">该视图下暂无农事排期</p>
                <button onClick={() => setIsModalOpen(true)} className={`mt-6 text-sm font-black text-${activeColor.primary} hover:opacity-80 underline underline-offset-8`}>立即创建第一份自定义农事记录</button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask?.id ? "编辑农事任务" : "新增自定义农事"}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">开始日期</label>
              <input type="date" value={editingTask?.startDate || ''} onChange={e => setEditingTask(prev => ({ ...prev, startDate: e.target.value, endDate: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900 font-bold focus:ring-4 focus:ring-emerald-500/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">结束日期</label>
              <input type="date" value={editingTask?.endDate || ''} onChange={e => setEditingTask(prev => ({ ...prev, endDate: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900 font-bold focus:ring-4 focus:ring-emerald-500/20 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">农事活动 (最多6字)</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {['选种', '播种', '施肥', '除草', '收获'].map(act => (
                <button key={act} onClick={() => setEditingTask(prev => ({ ...prev, activity: act }))} className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all">{act}</button>
              ))}
            </div>
            <input type="text" maxLength={6} placeholder="输入活动名称..." value={editingTask?.activity || ''} onChange={e => setEditingTask(prev => ({ ...prev, activity: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900 font-black text-lg focus:ring-4 focus:ring-emerald-500/20 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">详细处理事项</label>
            <textarea rows={4} placeholder="记录农事作业的详细步骤..." value={editingTask?.notes || ''} onChange={e => setEditingTask(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900 font-medium focus:ring-4 focus:ring-emerald-500/20 outline-none"></textarea>
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50">取消</button>
            <button onClick={saveTask} className={`flex-1 px-6 py-3 rounded-2xl ${activeColor.bg} text-white font-black shadow-xl shadow-${activeColor.primary}/20`}>保存至 04.txt (本地)</button>
          </div>
        </div>
      </Modal>

      <footer className="max-w-7xl mx-auto p-12 text-center text-gray-400 text-sm font-medium">
        <p>© {year} 大豆智慧农时管理系统 | 已适配 01-04.txt 多色系映射</p>
      </footer>
    </div>
  );
}
