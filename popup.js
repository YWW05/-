/**
 * @typedef {Object} WorkSettings
 * @property {number} monthlySalary - 月薪
 * @property {number} workingDays - 每月工作天数
 * @property {string} workStart - 上班开始时间
 * @property {string} workEnd - 下班结束时间
 * @property {boolean} hasBreak - 是否有午休
 * @property {string} breakStart - 午休开始时间
 * @property {string} breakEnd - 午休结束时间
 */

/** @type {WorkSettings} */
let settings = {
  monthlySalary: 0,
  workingDays: 22,
  workStart: '09:00',
  workEnd: '18:00',
  hasBreak: true,
  breakStart: '12:00',
  breakEnd: '13:00'
};

/**
 * 初始化插件
 */
async function init() {
  loadSettings();
  setupEventListeners();
  updateDisplay();
  setInterval(updateDisplay, 60000); // 每分钟更新一次
}

/**
 * 加载保存的设置
 */
async function loadSettings() {
  const saved = await chrome.storage.local.get('workSettings');
  if (saved.workSettings) {
    settings = saved.workSettings;
    updateSettingsForm();
  }
}

/**
 * 更新显示内容
 */
function updateDisplay() {
  updateDateTime();
  updateWeekendCountdown();
  updateWorkProgress();
  updateEarnings();
}

/**
 * 更新日期时间显示
 */
function updateDateTime() {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  document.getElementById('current-time').textContent = 
    now.toLocaleTimeString('zh-CN');
  document.getElementById('current-date').textContent = 
    `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
}

/**
 * 计算工作进度
 * @returns {number} 工作进度百分比
 */
function calculateWorkProgress() {
  const now = new Date();
  const workStart = getTimeFromString(settings.workStart);
  const workEnd = getTimeFromString(settings.workEnd);
  
  let totalWorkMinutes = (workEnd - workStart) / (1000 * 60);
  if (settings.hasBreak) {
    const breakStart = getTimeFromString(settings.breakStart);
    const breakEnd = getTimeFromString(settings.breakEnd);
    totalWorkMinutes -= (breakEnd - breakStart) / (1000 * 60);
  }
  
  const currentMinutes = (now - workStart) / (1000 * 60);
  return Math.min(100, Math.max(0, (currentMinutes / totalWorkMinutes) * 100));
}

/**
 * 更新工作进度显示
 */
function updateWorkProgress() {
  const progress = calculateWorkProgress();
  document.getElementById('work-progress').style.width = `${progress}%`;
  document.getElementById('progress-text').textContent = `工作进度: ${progress.toFixed(1)}%`;
}

/**
 * 计算当前收入
 * @returns {number} 当前收入
 */
function calculateCurrentEarnings() {
  const now = new Date();
  const workStart = getTimeFromString(settings.workStart);
  const workEnd = getTimeFromString(settings.workEnd);
  
  // 如果还没到上班时间或已经下班，返回0
  if (now < workStart || now > workEnd) {
    return 0;
  }
  
  let totalWorkMinutes = (workEnd - workStart) / (1000 * 60);
  let workedMinutes = (now - workStart) / (1000 * 60);
  
  // 处理午休时间
  if (settings.hasBreak) {
    const breakStart = getTimeFromString(settings.breakStart);
    const breakEnd = getTimeFromString(settings.breakEnd);
    const breakMinutes = (breakEnd - breakStart) / (1000 * 60);
    
    totalWorkMinutes -= breakMinutes;
    
    // 如果当前时间在午休期间，返回午休前的收入
    if (now >= breakStart && now <= breakEnd) {
      workedMinutes = (breakStart - workStart) / (1000 * 60);
    }
    // 如果已经过了午休时间
    else if (now > breakEnd) {
      workedMinutes -= breakMinutes;
    }
  }
  
  const dailySalary = settings.monthlySalary / settings.workingDays;
  const minuteSalary = dailySalary / totalWorkMinutes;
  
  return Math.max(0, minuteSalary * workedMinutes);
}

/**
 * 更新收入显示
 */
function updateEarnings() {
  const earnings = calculateCurrentEarnings();
  document.getElementById('current-earnings').textContent = 
    `今日已赚: ¥${earnings.toFixed(2)} (时薪：¥${((settings.monthlySalary / settings.workingDays / 8).toFixed(2))}/小时)`;
}

/**
 * 更新周末倒计时
 */
function updateWeekendCountdown() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0是周日，6是周六
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // 如果是周六或周日
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    return '正在享受周末假期 🎉';
  }
  
  // 如果是周五
  if (dayOfWeek === 5) {
    if (currentHour >= 18) {
      return '周末开始啦！放假愉快 🎉';
    }
    
    // 计算距离下午6点的时间
    const hoursLeft = 17 - currentHour;
    const minutesLeft = 60 - currentMinute;
    return `距离下班还有 ${hoursLeft}小时${minutesLeft}分钟 ⏰`;
  }
  
  // 计算距离周五的完整天数
  const daysUntilFriday = 5 - dayOfWeek;
  
  // 计算到下一个整点的时间
  let hoursLeft = 17 - currentHour; // 计算到18:00
  let minutesLeft = 60 - currentMinute;
  
  // 如果不是周五，需要计算完整的天数
  if (daysUntilFriday > 0) {
    return `距离周五下班还有 ${daysUntilFriday}天 ${hoursLeft}小时${minutesLeft}分钟 ⏰`;
  } else {
    return `距离下班还有 ${hoursLeft}小时${minutesLeft}分钟 ⏰`;
  }
}

/**
 * 将时间字符串转换为Date对象
 * @param {string} timeStr - 时间字符串 (HH:MM 格式)
 * @returns {Date} Date对象
 */
function getTimeFromString(timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('has-break').addEventListener('change', toggleBreakInputs);
}

/**
 * 保存设置
 */
async function saveSettings() {
  settings = {
    monthlySalary: parseFloat(document.getElementById('monthly-salary').value),
    workingDays: parseInt(document.getElementById('working-days').value),
    workStart: document.getElementById('work-start').value,
    workEnd: document.getElementById('work-end').value,
    hasBreak: document.getElementById('has-break').checked,
    breakStart: document.getElementById('break-start').value,
    breakEnd: document.getElementById('break-end').value
  };
  
  await chrome.storage.local.set({ workSettings: settings });
  updateDisplay();
}

/**
 * 更新设置表单
 */
function updateSettingsForm() {
  document.getElementById('monthly-salary').value = settings.monthlySalary;
  document.getElementById('working-days').value = settings.workingDays;
  document.getElementById('work-start').value = settings.workStart;
  document.getElementById('work-end').value = settings.workEnd;
  document.getElementById('has-break').checked = settings.hasBreak;
  document.getElementById('break-start').value = settings.breakStart;
  document.getElementById('break-end').value = settings.breakEnd;
  
  toggleBreakInputs();
}

/**
 * 切换午休输入框的显示状态
 */
function toggleBreakInputs() {
  const hasBreak = document.getElementById('has-break').checked;
  document.getElementById('break-start').disabled = !hasBreak;
  document.getElementById('break-end').disabled = !hasBreak;
}

/**
 * 获取随机古诗词
 * @returns {Promise<Object>} 返回诗词数据
 */
async function fetchPoetry() {
  try {
    console.log('开始获取诗词...');
    const response = await fetch('https://api.apiopen.top/api/sentences');
    console.log('API响应:', response);
    const result = await response.json();
    console.log('获取到的数据:', result);

    if (result.code === 200 && result.result) {
      return {
        content: result.result.name || '春江花月夜',
        author: result.result.from || '张若虚',
        origin: '经典诗词'
      };
    }
    throw new Error('API 返回数据格式错误');
  } catch (error) {
    console.error('获取诗词失败:', error);
    return {
      content: '春江潮水连海平，海上明月共潮生。',
      author: '张若虚',
      origin: '春江花月夜'
    };
  }
}

/**
 * 更新诗词显示
 */
async function updatePoetry() {
  const poetryContent = document.querySelector('.poetry');
  const poetryAuthor = document.querySelector('.poetry-author');
  const loadingText = document.querySelector('.poetry-loading');
  const copyBtn = document.querySelector('.copy-btn');
  
  if (!poetryContent || !poetryAuthor) {
    console.error('未找到诗词显示元素');
    return;
  }

  try {
    console.log('开始更新诗词显示...');
    loadingText.style.display = 'block';
    copyBtn.style.display = 'none';
    
    const poetry = await fetchPoetry();
    console.log('获取到诗词:', poetry);
    
    poetryContent.textContent = poetry.content;
    poetryAuthor.textContent = `${poetry.origin} · ${poetry.author}`;
    copyBtn.style.display = 'block';
  } catch (error) {
    console.error('更新诗词显示失败:', error);
    poetryContent.textContent = '春江潮水连海平，海上明月共潮生。';
    poetryAuthor.textContent = '春江花月夜 · 张若虚';
  } finally {
    loadingText.style.display = 'none';
  }
}

/**
 * 格式化日期时间
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的字符串
 */
function formatDateTime(date) {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = weekDays[date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${weekDay} ${hours}:${minutes}:${seconds}`;
}

/**
 * 计算距离周五下班（18:00）的倒计时
 * @returns {string} 倒计时文本
 */
function calculateWeekendCountdown() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0是周日，6是周六
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // 如果是周六或周日
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    return '正在享受周末假期 🎉';
  }
  
  // 如果是周五
  if (dayOfWeek === 5) {
    if (currentHour >= 18) {
      return '周末开始啦！放假愉快 🎉';
    }
    
    // 计算距离下午6点的时间
    const hoursLeft = 17 - currentHour;
    const minutesLeft = 60 - currentMinute;
    return `距离下班还有 ${hoursLeft}小时${minutesLeft}分钟 ⏰`;
  }
  
  // 计算距离周五的完整天数
  const daysUntilFriday = 5 - dayOfWeek;
  
  // 计算到下一个整点的时间
  let hoursLeft = 17 - currentHour; // 计算到18:00
  let minutesLeft = 60 - currentMinute;
  
  // 如果不是周五，需要计算完整的天数
  if (daysUntilFriday > 0) {
    return `距离周五下班还有 ${daysUntilFriday}天 ${hoursLeft}小时${minutesLeft}分钟 ⏰`;
  } else {
    return `距离下班还有 ${hoursLeft}小时${minutesLeft}分钟 ⏰`;
  }
}

/**
 * 计算工作进度和收入
 */
function calculateWorkProgress() {
  chrome.storage.sync.get([
    'monthSalary',
    'workDaysPerMonth',
    'workStartTime',
    'workEndTime',
    'hasLunchBreak',
    'lunchStartTime',
    'lunchEndTime'
  ], function(settings) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // 转换时间为分钟
    const [startHour, startMin] = settings.workStartTime.split(':').map(Number);
    const [endHour, endMin] = settings.workEndTime.split(':').map(Number);
    const workStartMinutes = startHour * 60 + startMin;
    const workEndMinutes = endHour * 60 + endMin;
    
    // 计算工作时长（考虑午休）
    let totalWorkMinutes = workEndMinutes - workStartMinutes;
    if (settings.hasLunchBreak) {
      const [lunchStartHour, lunchStartMin] = settings.lunchStartTime.split(':').map(Number);
      const [lunchEndHour, lunchEndMin] = settings.lunchEndTime.split(':').map(Number);
      const lunchBreakMinutes = (lunchEndHour * 60 + lunchEndMin) - (lunchStartHour * 60 + lunchStartMin);
      totalWorkMinutes -= lunchBreakMinutes;
    }
    
    // 计算进度
    const workedMinutes = Math.max(0, Math.min(currentTime - workStartMinutes, totalWorkMinutes));
    const progress = (workedMinutes / totalWorkMinutes) * 100;
    
    // 计算收入
    const minuteRate = settings.monthSalary / (settings.workDaysPerMonth * totalWorkMinutes);
    const currentEarnings = workedMinutes * minuteRate;
    
    // 更新显示
    document.getElementById('work-progress').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `工作进度: ${progress.toFixed(1)}%`;
    document.getElementById('hourly-rate').textContent = `时薪: ¥${(minuteRate * 60).toFixed(2)}`;
    document.getElementById('current-earnings').textContent = `当前收入: ¥${currentEarnings.toFixed(2)}`;
  });
}

/**
 * 更新时间显示
 */
function updateTimeDisplay() {
  const now = new Date();
  document.getElementById('current-datetime').textContent = formatDateTime(now);
  document.getElementById('weekend-countdown').textContent = calculateWeekendCountdown();
  calculateWorkProgress();
}

/**
 * 获取指定月份的工作日天数
 * @param {number} year 年份
 * @param {number} month 月份（0-11）
 * @returns {Promise<number>} 工作日天数
 */
async function getWorkingDays(year, month) {
  try {
    // 调用农历节假日API
    const response = await fetch(`http://timor.tech/api/holiday/month/${year}-${month + 1}`);
    const data = await response.json();
    
    if (data.code === 0 && data.type === 'success') {
      // 计算工作日
      let workdays = 0;
      const holidays = data.holiday;
      
      // 获取当月天数
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // 检查是否是节假日
        if (holidays[dateString]) {
          if (holidays[dateString].holiday === false) {
            // 调休工作日
            workdays++;
          }
        } else {
          // 不是周末且不是节假日则为工作日
          if (date.getDay() !== 0 && date.getDay() !== 6) {
            workdays++;
          }
        }
      }
      return workdays;
    }
    throw new Error('获取节假日数据失败');
  } catch (error) {
    console.error('获取工作日失败:', error);
    // 如果API失败，使用简单的工作日计算（周一至周五）
    return 22; // 默认每月22天工作日
  }
}

/**
 * 初始化设置
 */
async function initializeSettings() {
  // 获取当前月份的工作日数量
  const now = new Date();
  const workDays = await getWorkingDays(now.getFullYear(), now.getMonth());
  
  // 加载保存的设置
  chrome.storage.sync.get([
    'monthSalary',
    'workStartTime',
    'workEndTime',
    'hasLunchBreak',
    'lunchStartTime',
    'lunchEndTime'
  ], function(items) {
    if (items.monthSalary) document.getElementById('monthSalary').value = items.monthSalary;
    document.getElementById('workDaysPerMonth').value = workDays;
    if (items.workStartTime) document.getElementById('workStartTime').value = items.workStartTime;
    if (items.workEndTime) document.getElementById('workEndTime').value = items.workEndTime;
    if (items.hasLunchBreak) {
      document.getElementById('hasLunchBreak').checked = items.hasLunchBreak;
      document.getElementById('lunchBreakTimes').style.display = 'block';
    }
    if (items.lunchStartTime) document.getElementById('lunchStartTime').value = items.lunchStartTime;
    if (items.lunchEndTime) document.getElementById('lunchEndTime').value = items.lunchEndTime;
  });

  // 设置面板切换
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  
  settingsToggle.addEventListener('click', () => {
    const isHidden = settingsPanel.style.display === 'none';
    settingsPanel.style.display = isHidden ? 'block' : 'none';
    settingsToggle.textContent = isHidden ? '隐藏设置' : '显示设置';
  });

  // 午休复选框事件
  document.getElementById('hasLunchBreak').addEventListener('change', function(e) {
    document.getElementById('lunchBreakTimes').style.display = e.target.checked ? 'block' : 'none';
  });

  // 保存设置
  document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const settings = {
      monthSalary: document.getElementById('monthSalary').value,
      workDaysPerMonth: document.getElementById('workDaysPerMonth').value,
      workStartTime: document.getElementById('workStartTime').value,
      workEndTime: document.getElementById('workEndTime').value,
      hasLunchBreak: document.getElementById('hasLunchBreak').checked,
      lunchStartTime: document.getElementById('lunchStartTime').value,
      lunchEndTime: document.getElementById('lunchEndTime').value
    };

    chrome.storage.sync.set(settings, function() {
      alert('设置已保存');
      calculateWorkProgress();
    });
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  updatePoetry();
  initializeSettings();
  updateTimeDisplay();
  
  // 每分钟更新一次时间和进度
  setInterval(updateTimeDisplay, 60000);
}); 